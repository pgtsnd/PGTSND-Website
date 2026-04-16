import { Router } from "express";
import {
  db,
  organizationsTable,
  insertOrganizationSchema,
  updateOrganizationSchema,
  selectOrganizationSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/organizations",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const orgs = await db.select().from(organizationsTable);
    validateAndSendArray(res, selectOrganizationSchema, orgs);
  },
);

router.get(
  "/organizations/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, req.params.id))
      .limit(1);

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    validateAndSend(res, selectOrganizationSchema, org);
  },
);

router.post(
  "/organizations",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = insertOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [org] = await db
      .insert(organizationsTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectOrganizationSchema, org, 201);
  },
);

router.patch(
  "/organizations/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = updateOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [org] = await db
      .update(organizationsTable)
      .set(parsed.data)
      .where(eq(organizationsTable.id, req.params.id))
      .returning();

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    validateAndSend(res, selectOrganizationSchema, org);
  },
);

router.delete(
  "/organizations/:id",
  requireRole("owner"),
  async (req, res) => {
    const [org] = await db
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, req.params.id))
      .returning();

    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    res.json({ message: "Organization deleted" });
  },
);

export default router;
