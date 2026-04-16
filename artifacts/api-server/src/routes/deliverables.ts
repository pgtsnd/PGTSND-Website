import { Router } from "express";
import {
  db,
  deliverablesTable,
  insertDeliverableSchema,
  updateDeliverableSchema,
  selectDeliverableSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromDeliverable,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import { notifyDeliverableSubmittedForReview } from "../services/notifications";

const router = Router();

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

    const [deliverable] = await db
      .insert(deliverablesTable)
      .values(parsed.data)
      .returning();
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

    const [deliverable] = await db
      .update(deliverablesTable)
      .set(parsed.data)
      .where(eq(deliverablesTable.id, req.params.id))
      .returning();

    if (!deliverable) {
      res.status(404).json({ error: "Deliverable not found" });
      return;
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
