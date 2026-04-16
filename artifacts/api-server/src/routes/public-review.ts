import { Router } from "express";
import {
  db,
  reviewLinksTable,
  deliverablesTable,
  projectsTable,
  videoCommentsTable,
  videoCommentRepliesTable,
} from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { notifyPublicReviewComment } from "../services/notifications";

const router = Router();

router.get(
  "/public/review/:token",
  async (req, res) => {
    const [link] = await db
      .select()
      .from(reviewLinksTable)
      .where(eq(reviewLinksTable.token, req.params.token))
      .limit(1);

    if (!link) {
      res.status(404).json({ error: "Review link not found" });
      return;
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      res.status(410).json({ error: "Review link has expired" });
      return;
    }

    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, link.deliverableId))
      .limit(1);

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
    }

    const [project] = await db
      .select({ name: projectsTable.name })
      .from(projectsTable)
      .where(eq(projectsTable.id, deliverable.projectId))
      .limit(1);

    const comments = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.deliverableId, deliverable.id))
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

    res.json({
      deliverable: {
        ...deliverable,
        projectName: project?.name ?? "",
      },
      comments: commentsWithReplies,
    });
  },
);

router.post(
  "/public/review/:token/comments",
  async (req, res) => {
    const { timestampSeconds, content, authorName } = req.body;

    if (timestampSeconds === undefined || !content?.trim() || !authorName?.trim()) {
      res.status(400).json({ error: "timestampSeconds, content, and authorName are required" });
      return;
    }

    const [link] = await db
      .select()
      .from(reviewLinksTable)
      .where(eq(reviewLinksTable.token, req.params.token))
      .limit(1);

    if (!link) {
      res.status(404).json({ error: "Review link not found" });
      return;
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      res.status(410).json({ error: "Review link has expired" });
      return;
    }

    const [comment] = await db
      .insert(videoCommentsTable)
      .values({
        deliverableId: link.deliverableId,
        authorId: null,
        authorName: authorName.trim(),
        timestampSeconds: Number(timestampSeconds),
        content: content.trim(),
      })
      .returning();

    void notifyPublicReviewComment({
      deliverableId: link.deliverableId,
      authorName: comment.authorName,
      content: comment.content,
      timestampSeconds: comment.timestampSeconds,
      isReply: false,
    });

    res.status(201).json({ ...comment, replies: [] });
  },
);

router.post(
  "/public/review/:token/comments/:commentId/replies",
  async (req, res) => {
    const { content, authorName } = req.body;

    if (!content?.trim() || !authorName?.trim()) {
      res.status(400).json({ error: "content and authorName are required" });
      return;
    }

    const [link] = await db
      .select()
      .from(reviewLinksTable)
      .where(eq(reviewLinksTable.token, req.params.token))
      .limit(1);

    if (!link) {
      res.status(404).json({ error: "Review link not found" });
      return;
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      res.status(410).json({ error: "Review link has expired" });
      return;
    }

    const [comment] = await db
      .select()
      .from(videoCommentsTable)
      .where(eq(videoCommentsTable.id, req.params.commentId))
      .limit(1);

    if (!comment || comment.deliverableId !== link.deliverableId) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const [reply] = await db
      .insert(videoCommentRepliesTable)
      .values({
        commentId: req.params.commentId,
        authorId: null,
        authorName: authorName.trim(),
        content: content.trim(),
      })
      .returning();

    void notifyPublicReviewComment({
      deliverableId: link.deliverableId,
      authorName: reply.authorName,
      content: reply.content,
      isReply: true,
    });

    res.status(201).json(reply);
  },
);

export default router;
