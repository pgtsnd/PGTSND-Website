import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { Readable } from "stream";
import { eq, and, like, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  deliverablesTable,
  reviewLinksTable,
  mediaUploadsTable,
} from "@workspace/db";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { verifyToken } from "../lib/auth";
import { checkProjectAccess } from "../middleware/project-access";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const SESSION_COOKIE = "pgtsnd_session";

type SessionUser = {
  id: string;
  role: "owner" | "partner" | "crew" | "client";
};

async function loadSessionUser(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);
  return user ?? null;
}

async function teamUploaderGuard(req: Request, res: Response, next: NextFunction) {
  const user = await loadSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (user.role !== "owner" && user.role !== "partner" && user.role !== "crew") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}

/**
 * POST /storage/uploads/request-url
 * Restricted to authenticated team members.
 */
router.post(
  "/storage/uploads/request-url",
  teamUploaderGuard,
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required fields" });
      return;
    }
    const ALLOWED_CONTENT_TYPES = new Set([
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);
    const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
    if (!ALLOWED_CONTENT_TYPES.has(parsed.data.contentType)) {
      res.status(400).json({ error: "Unsupported content type." });
      return;
    }
    if (parsed.data.size <= 0 || parsed.data.size > MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: "File size out of allowed range (max 2GB)" });
      return;
    }
    try {
      const { name, size, contentType } = parsed.data;
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Error generating upload URL");
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  },
);

/**
 * GET /storage/public-objects/*
 * Unconditionally public app/website assets.
 */
router.get(
  "/storage/public-objects/*filePath",
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join("/") : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      const response = await objectStorageService.downloadObject(file);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, "Error serving public object");
      res.status(500).json({ error: "Failed to serve public object" });
    }
  },
);

/**
 * POST /storage/media
 * Register an uploaded media file in the media_uploads table so it can be
 * listed in the team uploads page and served publicly to the website.
 */
const SAFE_MEDIA_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

router.post(
  "/storage/media",
  teamUploaderGuard,
  async (req: Request, res: Response) => {
    const user = await loadSessionUser(req);
    const body = req.body as {
      objectPath?: string;
      name?: string;
      label?: string | null;
      folder?: string | null;
      contentType?: string;
      sizeBytes?: number;
    };
    const folderRaw = (body.folder ?? "site").toString().trim();
    const folder = (folderRaw || "site").slice(0, 200).replace(/[^a-zA-Z0-9 _\-./]/g, "");
    if (
      !body.objectPath ||
      typeof body.objectPath !== "string" ||
      !body.objectPath.startsWith("/objects/") ||
      !body.name ||
      !body.contentType ||
      typeof body.sizeBytes !== "number" ||
      body.sizeBytes <= 0
    ) {
      res.status(400).json({ error: "Invalid media metadata" });
      return;
    }
    // Block registering a path that's already attached to a private deliverable —
    // otherwise team members could expose private project assets via the public
    // media-serving path.
    const fileUrl = `/api/storage${body.objectPath}`;
    const [existingDeliverable] = await db
      .select({ id: deliverablesTable.id })
      .from(deliverablesTable)
      .where(eq(deliverablesTable.fileUrl, fileUrl))
      .limit(1);
    if (existingDeliverable) {
      res.status(409).json({ error: "This object is attached to a private deliverable." });
      return;
    }
    try {
      // Verify the object actually exists in storage and pull its true size /
      // content-type instead of trusting client metadata.
      const objectFile = await objectStorageService.getObjectEntityFile(body.objectPath);
      const [exists] = await objectFile.exists();
      if (!exists) {
        res.status(404).json({ error: "Object not found in storage." });
        return;
      }
      const [meta] = await objectFile.getMetadata();
      const trueContentType =
        typeof meta.contentType === "string" && meta.contentType
          ? meta.contentType
          : body.contentType;
      if (!SAFE_MEDIA_CONTENT_TYPES.has(trueContentType)) {
        res.status(400).json({ error: "Unsupported content type." });
        return;
      }
      const trueSize = typeof meta.size === "string" ? Number(meta.size) : Number(meta.size ?? 0);
      const sizeBytes = Number.isFinite(trueSize) && trueSize > 0 ? trueSize : body.sizeBytes;

      const [row] = await db
        .insert(mediaUploadsTable)
        .values({
          objectPath: body.objectPath,
          name: body.name.slice(0, 500),
          label: body.label?.slice(0, 500) || null,
          folder: folder || "site",
          contentType: trueContentType,
          sizeBytes,
          uploadedBy: user?.id ?? null,
        })
        .onConflictDoNothing({ target: mediaUploadsTable.objectPath })
        .returning();
      if (!row) {
        const [existing] = await db
          .select()
          .from(mediaUploadsTable)
          .where(eq(mediaUploadsTable.objectPath, body.objectPath))
          .limit(1);
        res.json(existing);
        return;
      }
      res.json(row);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found in storage." });
        return;
      }
      req.log.error({ err: error }, "Error registering media upload");
      res.status(500).json({ error: "Failed to register media" });
    }
  },
);

/**
 * GET /storage/media
 * List all registered media uploads (team only).
 */
router.get(
  "/storage/media",
  teamUploaderGuard,
  async (_req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(mediaUploadsTable)
      .orderBy(desc(mediaUploadsTable.createdAt));
    res.json({ items: rows });
  },
);

/**
 * DELETE /storage/media/:id
 * Remove a media record (does not delete the underlying GCS object).
 */
router.delete(
  "/storage/media/:id",
  teamUploaderGuard,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    await db.delete(mediaUploadsTable).where(eq(mediaUploadsTable.id, id));
    res.json({ ok: true });
  },
);

/**
 * GET /storage/objects/*
 * Serves a private object only if the caller has access to its owning
 * deliverable, either through:
 *   - a valid (non-expired) shared review token via `?reviewToken=...`, or
 *   - an authenticated session whose role grants project access.
 *
 * Objects that aren't referenced by any deliverable are not served.
 */
router.get(
  "/storage/objects/*path",
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.path;
      const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
      const objectPath = `/objects/${wildcardPath}`;
      const fileUrl = `/api/storage${objectPath}`;

      // Public media uploads are served unconditionally — these are site
      // assets registered by the team for use on the public website.
      const [media] = await db
        .select({ id: mediaUploadsTable.id })
        .from(mediaUploadsTable)
        .where(eq(mediaUploadsTable.objectPath, objectPath))
        .limit(1);

      if (media) {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        const response = await objectStorageService.downloadObject(objectFile, 3600);
        res.status(response.status);
        response.headers.forEach((value, key) => res.setHeader(key, value));
        if (response.body) {
          Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
        } else {
          res.end();
        }
        return;
      }

      const [deliverable] = await db
        .select({
          id: deliverablesTable.id,
          projectId: deliverablesTable.projectId,
          fileUrl: deliverablesTable.fileUrl,
        })
        .from(deliverablesTable)
        .where(
          and(
            eq(deliverablesTable.fileUrl, fileUrl),
            like(deliverablesTable.fileUrl, "/api/storage/objects/%"),
          ),
        )
        .limit(1);

      if (!deliverable) {
        res.status(404).json({ error: "Object not found" });
        return;
      }

      const reviewToken = typeof req.query.reviewToken === "string" ? req.query.reviewToken : null;
      let allowed = false;

      if (reviewToken) {
        const [link] = await db
          .select()
          .from(reviewLinksTable)
          .where(
            and(
              eq(reviewLinksTable.token, reviewToken),
              eq(reviewLinksTable.deliverableId, deliverable.id),
            ),
          )
          .limit(1);
        if (link && (!link.expiresAt || new Date(link.expiresAt) >= new Date())) {
          allowed = true;
        }
      }

      if (!allowed) {
        const user = await loadSessionUser(req);
        if (!user) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }
        allowed = await checkProjectAccess(user.id, user.role, deliverable.projectId);
        if (!allowed) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      }

      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      const response = await objectStorageService.downloadObject(objectFile);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Object not found" });
        return;
      }
      req.log.error({ err: error }, "Error serving object");
      res.status(500).json({ error: "Failed to serve object" });
    }
  },
);

export default router;
