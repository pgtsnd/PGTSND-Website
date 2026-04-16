import { Router } from "express";
import {
  db,
  phasesTable,
  insertPhaseSchema,
  updatePhaseSchema,
  selectPhaseSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromPhase,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/projects/:projectId/phases",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const phases = await db
      .select()
      .from(phasesTable)
      .where(eq(phasesTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectPhaseSchema, phases);
  },
);

router.get(
  "/phases/:id",
  requireProjectAccessViaEntity(resolveProjectFromPhase, "id"),
  async (req, res) => {
    const [phase] = await db
      .select()
      .from(phasesTable)
      .where(eq(phasesTable.id, req.params.id))
      .limit(1);

    if (!phase) {
      res.status(404).json({ error: "Phase not found" });
      return;
    }

    validateAndSend(res, selectPhaseSchema, phase);
  },
);

router.post(
  "/projects/:projectId/phases",
  requireRole("owner", "partner"),
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertPhaseSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [phase] = await db.insert(phasesTable).values(parsed.data).returning();
    validateAndSend(res, selectPhaseSchema, phase, 201);
  },
);

router.patch(
  "/phases/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromPhase, "id"),
  async (req, res) => {
    const parsed = updatePhaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [phase] = await db
      .update(phasesTable)
      .set(parsed.data)
      .where(eq(phasesTable.id, req.params.id))
      .returning();

    if (!phase) {
      res.status(404).json({ error: "Phase not found" });
      return;
    }

    validateAndSend(res, selectPhaseSchema, phase);
  },
);

router.delete(
  "/phases/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromPhase, "id"),
  async (req, res) => {
    const [phase] = await db
      .delete(phasesTable)
      .where(eq(phasesTable.id, req.params.id))
      .returning();

    if (!phase) {
      res.status(404).json({ error: "Phase not found" });
      return;
    }

    res.json({ message: "Phase deleted" });
  },
);

export default router;
