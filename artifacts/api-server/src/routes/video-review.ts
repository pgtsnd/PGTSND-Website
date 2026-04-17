import { Router } from "express";
import {
  db,
  videoCommentsTable,
  videoCommentRepliesTable,
  reviewLinksTable,
  deliverablesTable,
  deliverableVersionsTable,
  projectsTable,
  selectVideoCommentSchema,
  selectVideoCommentReplySchema,
  selectReviewLinkSchema,
} from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccessViaEntity,
  resolveProjectFromDeliverable,
  resolveProjectFromVideoComment,
} from "../middleware/project-access";
import {
  notifyNewVideoComment,
  notifyVideoCommentResolved,
} from "../services/notifications";

const router = Router();

async function resolveCurrentDeliverableVersionId(
  deliverableId: string,
): Promise<string | null> {
  const [latest] = await db
    .select({ id: deliverableVersionsTable.id })
    .from(deliverableVersionsTable)
    .where(eq(deliverableVersionsTable.deliverableId, deliverableId))
    .orderBy(desc(deliverableVersionsTable.createdAt))
    .limit(1);
  return latest?.id ?? null;
}

router.get(
  "/deliverables/:deliverableId/comments",
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const comments = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.deliverableId, req.params.deliverableId))
      .orderBy(asc(videoCommentsTable.timestampSeconds));

    const commentsWithReplies = [];
    for (const comment of comments) {
      const replies = await db
        .select()
        .from(videoCommentRepliesTable)
        .where(eq(videoCommentRepliesTable.commentId, comment.id))
        .orderBy(asc(videoCommentRepliesTable.createdAt));
      commentsWithReplies.push({ ...comment, replies });
    }

    res.json(commentsWithReplies);
  },
);

router.post(
  "/deliverables/:deliverableId/comments",
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const { timestampSeconds, content } = req.body;

    if (timestampSeconds === undefined || !content?.trim()) {
      res.status(400).json({ error: "timestampSeconds and content are required" });
      return;
    }

    const requestedVersionId =
      typeof req.body.deliverableVersionId === "string" && req.body.deliverableVersionId.length > 0
        ? req.body.deliverableVersionId
        : null;

    let deliverableVersionId: string | null = null;
    if (requestedVersionId) {
      const [version] = await db
        .select({ id: deliverableVersionsTable.id })
        .from(deliverableVersionsTable)
        .where(
          and(
            eq(deliverableVersionsTable.id, requestedVersionId),
            eq(deliverableVersionsTable.deliverableId, req.params.deliverableId),
          ),
        )
        .limit(1);
      if (!version) {
        res.status(400).json({ error: "deliverableVersionId does not belong to this deliverable" });
        return;
      }
      deliverableVersionId = version.id;
    } else {
      deliverableVersionId = await resolveCurrentDeliverableVersionId(
        req.params.deliverableId,
      );
    }

    const [comment] = await db
      .insert(videoCommentsTable)
      .values({
        deliverableId: req.params.deliverableId,
        deliverableVersionId,
        authorId: req.user!.id,
        authorName: req.user!.name,
        timestampSeconds: Number(timestampSeconds),
        content: content.trim(),
      })
      .returning();

    void notifyNewVideoComment({
      deliverableId: req.params.deliverableId,
      actorUserId: req.user!.id,
      actorName: req.user!.name ?? "A team member",
      content: comment.content,
      timestampSeconds: comment.timestampSeconds,
      isReply: false,
    });

    res.status(201).json({ ...comment, replies: [] });
  },
);

router.patch(
  "/comments/:commentId/resolve",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromVideoComment, "commentId"),
  async (req, res) => {
    const { resolved, note } = req.body;

    if (typeof resolved !== "boolean") {
      res.status(400).json({ error: "resolved must be a boolean" });
      return;
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      res.status(400).json({ error: "note must be a string" });
      return;
    }

    const [previous] = await db
      .select({ resolvedAt: videoCommentsTable.resolvedAt })
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .limit(1);

    const [updated] = await db
      .update(videoCommentsTable)
      .set(
        resolved
          ? {
              resolvedAt: new Date(),
              resolvedBy: req.user!.id,
              resolvedByName: req.user!.name,
              resolvedNote: typeof note === "string" && note.trim() ? note.trim() : null,
            }
          : {
              resolvedAt: null,
              resolvedBy: null,
              resolvedByName: null,
              resolvedNote: null,
            },
      )
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .returning();

    // Only notify on the unresolved -> resolved transition to avoid
    // duplicate emails if the resolve action is repeated.
    const wasResolved = Boolean(previous?.resolvedAt);
    if (resolved && updated && !wasResolved) {
      void notifyVideoCommentResolved({
        commentId: updated.id,
        resolverUserId: req.user!.id,
        resolverName: req.user!.name ?? "A team member",
        resolutionNote: updated.resolvedNote,
      });
    }

    res.json(updated);
  },
);

/**
 * Reopen a previously-resolved comment.
 *
 * Permission: project access required (handled by middleware) AND the caller
 * must either be on the team (owner/partner/crew) OR the original author of
 * the comment. This lets a client whose feedback was marked resolved
 * prematurely reopen their own comment from the resolution email, without
 * granting them the broader team-only resolve/unresolve capability.
 */
router.post(
  "/comments/:commentId/reopen",
  requireProjectAccessViaEntity(resolveProjectFromVideoComment, "commentId"),
  async (req, res) => {
    const [comment] = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .limit(1);

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const role = req.user!.role;
    const isTeam = role === "owner" || role === "partner" || role === "crew";
    const isAuthor = comment.authorId === req.user!.id;

    if (!isTeam && !isAuthor) {
      res
        .status(403)
        .json({ error: "Only the original author or team can reopen a comment" });
      return;
    }

    if (!comment.resolvedAt) {
      res.json(comment);
      return;
    }

    const [updated] = await db
      .update(videoCommentsTable)
      .set({
        resolvedAt: null,
        resolvedBy: null,
        resolvedByName: null,
        resolvedNote: null,
      })
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .returning();

    res.json(updated);
  },
);

router.post(
  "/comments/:commentId/replies",
  async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const [comment] = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .limit(1);

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const [reply] = await db
      .insert(videoCommentRepliesTable)
      .values({
        commentId: req.params.commentId,
        authorId: req.user!.id,
        authorName: req.user!.name,
        content: content.trim(),
      })
      .returning();

    void notifyNewVideoComment({
      deliverableId: comment.deliverableId,
      actorUserId: req.user!.id,
      actorName: req.user!.name ?? "A team member",
      content: reply.content,
      isReply: true,
    });

    res.status(201).json(reply);
  },
);

router.post(
  "/deliverables/:deliverableId/review-links",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const { expiresInDays } = req.body;

    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const [link] = await db
      .insert(reviewLinksTable)
      .values({
        deliverableId: req.params.deliverableId,
        createdBy: req.user!.id,
        expiresAt,
      })
      .returning();

    res.status(201).json(link);
  },
);

router.get(
  "/deliverables/:deliverableId/review-links",
  requireRole("owner", "partner", "crew"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const links = await db
      .select()
      .from(reviewLinksTable)
      .where(eq(reviewLinksTable.deliverableId, req.params.deliverableId));

    res.json(links);
  },
);

export default router;
