import { Router } from "express";
import { db, messagesTable, insertMessageSchema, selectMessageSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import {
  requireProjectAccess,
  requireProjectAccessViaEntity,
  resolveProjectFromMessage,
} from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get(
  "/projects/:projectId/messages",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectMessageSchema, messages);
  },
);

router.get(
  "/messages/:id",
  requireProjectAccessViaEntity(resolveProjectFromMessage, "id"),
  async (req, res) => {
    const [message] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, req.params.id));

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    validateAndSend(res, selectMessageSchema, message);
  },
);

router.post(
  "/projects/:projectId/messages",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertMessageSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
      senderId: req.user!.id,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [message] = await db
      .insert(messagesTable)
      .values(parsed.data)
      .returning();
    validateAndSend(res, selectMessageSchema, message, 201);
  },
);

router.patch(
  "/messages/:id/read",
  requireProjectAccessViaEntity(resolveProjectFromMessage, "id"),
  async (req, res) => {
    const [updated] = await db
      .update(messagesTable)
      .set({ read: true })
      .where(eq(messagesTable.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    validateAndSend(res, selectMessageSchema, updated);
  },
);

router.delete(
  "/messages/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [message] = await db
      .delete(messagesTable)
      .where(eq(messagesTable.id, req.params.id))
      .returning();

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json({ message: "Message deleted" });
  },
);

export default router;
