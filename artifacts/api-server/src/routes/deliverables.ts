import { Router } from "express";
import {
  db,
  deliverablesTable,
  deliverableVersionsTable,
  insertDeliverableSchema,
  updateDeliverableSchema,
  selectDeliverableSchema,
  selectDeliverableVersionSchema,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromDeliverable,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import { notifyDeliverableSubmittedForReview } from "../services/notifications";

const router = Router();

function bumpVersion(current: string | null | undefined): string {
  if (!current) return "v2";
  const m = /^v(\d+)$/i.exec(current.trim());
  if (m) return `v${parseInt(m[1], 10) + 1}`;
  return `${current}.next`;
}

router.get(
  "/projects/:projectId/deliverables",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const deliverables = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectDeliverableSchema, deliverables);
  },
);

router.get(
  "/deliverables/:id",
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "id"),
  async (req, res) => {
    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, req.params.id))
      .limit(1);

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    validateAndSend(res, selectDeliverableSchema, deliverable);
  },
);

router.get(
  "/deliverables/:id/versions",
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "id"),
  async (req, res) => {
    const versions = await db
      .select()
      .from(deliverableVersionsTable)
      .where(eq(deliverableVersionsTable.deliverableId, req.params.id))
      .orderBy(desc(deliverableVersionsTable.createdAt));
    validateAndSendArray(res, selectDeliverableVersionSchema, versions);
  },
);

router.post(
  "/projects/:projectId/deliverables",
  requireRole("owner", "partner", "crew"),
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertDeliverableSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const values = {
      ...parsed.data,
      uploadedBy: parsed.data.fileUrl ? req.user!.id : parsed.data.uploadedBy ?? null,
    };

    const [deliverable] = await db
      .insert(deliverablesTable)
      .values(values)
      .returning();

    if (deliverable.fileUrl) {
      await db.insert(deliverableVersionsTable).values({
        deliverableId: deliverable.id,
        version: deliverable.version || "v1",
        fileUrl: deliverable.fileUrl,
        uploadedById: req.user?.id ?? null,
      });
    }

    validateAndSend(res, selectDeliverableSchema, deliverable, 201);
  },
);

router.patch(
  "/deliverables/:id",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "id"),
  async (req, res) => {
    const parsed = updateDeliverableSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [existing] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, req.params.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    const updateData: typeof parsed.data & { uploadedBy?: string | null } = {
      ...parsed.data,
    };
    let createNewVersionRow: { version: string; fileUrl: string } | null = null;

    const newFileUrl = parsed.data.fileUrl;
    if (
      typeof newFileUrl === "string" &&
      newFileUrl.length > 0 &&
      newFileUrl !== existing.fileUrl
    ) {
      const existingVersions = await db
        .select()
        .from(deliverableVersionsTable)
        .where(eq(deliverableVersionsTable.deliverableId, existing.id))
        .orderBy(desc(deliverableVersionsTable.createdAt));

      if (existingVersions.length === 0 && existing.fileUrl) {
        await db.insert(deliverableVersionsTable).values({
          deliverableId: existing.id,
          version: existing.version || "v1",
          fileUrl: existing.fileUrl,
          uploadedById: existing.uploadedBy ?? req.user?.id ?? null,
        });
      }

      const nextVersion = bumpVersion(existing.version);
      updateData.version = nextVersion;
      updateData.uploadedBy = req.user!.id;
      createNewVersionRow = { version: nextVersion, fileUrl: newFileUrl };
    }

    const [deliverable] = await db
      .update(deliverablesTable)
      .set(updateData)
      .where(eq(deliverablesTable.id, req.params.id))
      .returning();

    if (createNewVersionRow) {
      await db.insert(deliverableVersionsTable).values({
        deliverableId: deliverable.id,
        version: createNewVersionRow.version,
        fileUrl: createNewVersionRow.fileUrl,
        uploadedById: req.user?.id ?? null,
      });
    }

    validateAndSend(res, selectDeliverableSchema, deliverable);
  },
);

router.post(
  "/deliverables/:id/submit-for-review",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "id"),
  async (req, res) => {
    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, req.params.id))
      .limit(1);

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    if (deliverable.status === "approved") {
      res.status(400).json({ error: "Deliverable is already approved" });
      return;
    }

    if (deliverable.status === "in_review") {
      res.status(400).json({ error: "Deliverable is already in review" });
      return;
    }

    const [updated] = await db
      .update(deliverablesTable)
      .set({ status: "in_review", submittedAt: new Date() })
      .where(eq(deliverablesTable.id, req.params.id))
      .returning();

    void notifyDeliverableSubmittedForReview(req.params.id);

    validateAndSend(res, selectDeliverableSchema, updated);
  },
);

router.delete(
  "/deliverables/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "id"),
  async (req, res) => {
    const [deliverable] = await db
      .delete(deliverablesTable)
      .where(eq(deliverablesTable.id, req.params.id))
      .returning();

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    res.json({ message: "Deliverable deleted" });
  },
);

export default router;
