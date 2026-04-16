import { Router } from "express";
import {
  db,
  reviewsTable,
  insertReviewSchema,
  updateReviewSchema,
  selectReviewSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccessViaEntity,
  resolveProjectFromDeliverable,
  resolveProjectFromReview,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/deliverables/:deliverableId/reviews",
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.deliverableId, req.params.deliverableId));
    validateAndSendArray(res, selectReviewSchema, reviews);
  },
);

router.get(
  "/reviews/:id",
  requireProjectAccessViaEntity(resolveProjectFromReview, "id"),
  async (req, res) => {
    const [review] = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, req.params.id))
      .limit(1);

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    validateAndSend(res, selectReviewSchema, review);
  },
);

router.post(
  "/deliverables/:deliverableId/reviews",
  requireRole("owner", "partner", "client"),
  requireProjectAccessViaEntity(resolveProjectFromDeliverable, "deliverableId"),
  async (req, res) => {
    const parsed = insertReviewSchema.safeParse({
      ...req.body,
      deliverableId: req.params.deliverableId,
      reviewerId: req.user!.id,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [review] = await db
      .insert(reviewsTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectReviewSchema, review, 201);
  },
);

router.patch(
  "/reviews/:id",
  requireRole("owner", "partner", "client"),
  requireProjectAccessViaEntity(resolveProjectFromReview, "id"),
  async (req, res) => {
    const parsed = updateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [review] = await db
      .update(reviewsTable)
      .set(parsed.data)
      .where(eq(reviewsTable.id, req.params.id))
      .returning();

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    validateAndSend(res, selectReviewSchema, review);
  },
);

router.delete(
  "/reviews/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromReview, "id"),
  async (req, res) => {
    const [review] = await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, req.params.id))
      .returning();

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json({ message: "Review deleted" });
  },
);

export default router;
