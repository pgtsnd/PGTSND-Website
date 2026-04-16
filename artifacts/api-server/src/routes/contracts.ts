import { Router } from "express";
import {
  db,
  contractsTable,
  insertContractSchema,
  updateContractSchema,
  selectContractSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromContract,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/projects/:projectId/contracts",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const contracts = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectContractSchema, contracts);
  },
);

router.get(
  "/contracts/:id",
  requireProjectAccessViaEntity(resolveProjectFromContract, "id"),
  async (req, res) => {
    const [contract] = await db
      .select()
      .from(contractsTable)
      .where(eq(contractsTable.id, req.params.id))
      .limit(1);

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    validateAndSend(res, selectContractSchema, contract);
  },
);

router.post(
  "/projects/:projectId/contracts",
  requireRole("owner", "partner"),
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertContractSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [contract] = await db
      .insert(contractsTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectContractSchema, contract, 201);
  },
);

router.patch(
  "/contracts/:id",
  requireRole("owner", "partner"),
  requireProjectAccessViaEntity(resolveProjectFromContract, "id"),
  async (req, res) => {
    const parsed = updateContractSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [contract] = await db
      .update(contractsTable)
      .set(parsed.data)
      .where(eq(contractsTable.id, req.params.id))
      .returning();

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    validateAndSend(res, selectContractSchema, contract);
  },
);

router.delete(
  "/contracts/:id",
  requireRole("owner"),
  requireProjectAccessViaEntity(resolveProjectFromContract, "id"),
  async (req, res) => {
    const [contract] = await db
      .delete(contractsTable)
      .where(eq(contractsTable.id, req.params.id))
      .returning();

    if (!contract) {
      res.status(404).json({ error: "Contract not found" });
      return;
    }

    res.json({ message: "Contract deleted" });
  },
);

export default router;
