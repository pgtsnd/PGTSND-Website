import { Router } from "express";
import {
  db,
  videoCommentsTable,
  videoCommentRepliesTable,
  reviewLinksTable,
  deliverablesTable,
  projectsTable,
  selectVideoCommentSchema,
  selectVideoCommentReplySchema,
  selectReviewLinkSchema,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccessViaEntity,
  resolveProjectFromDeliverable,
  resolveProjectFromVideoComment,
} from "../middleware/project-access";
import { notifyNewVideoComment } from "../services/notifications";

const router = Router();

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

    const [comment] = await db
      .insert(videoCommentsTable)
      .values({
        deliverableId: req.params.deliverableId,
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
