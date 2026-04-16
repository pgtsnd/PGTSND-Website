import { Router } from "express";
import { db, usersTable, insertUserSchema, updateUserSchema, selectUserSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

const NOTIFICATION_PREF_KEYS = ["emailNotifyReviews", "emailNotifyComments"] as const;
type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];

function parseNotificationPreferences(
  body: unknown,
): { ok: true; data: Partial<Record<NotificationPrefKey, boolean>> } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Body must be an object" };
  }
  const data: Partial<Record<NotificationPrefKey, boolean>> = {};
  for (const key of Object.keys(body as Record<string, unknown>)) {
    if (!(NOTIFICATION_PREF_KEYS as readonly string[]).includes(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
    const value = (body as Record<string, unknown>)[key];
    if (typeof value !== "boolean") {
      return { ok: false, error: `${key} must be a boolean` };
    }
    data[key as NotificationPrefKey] = value;
  }
  return { ok: true, data };
}

router.get("/users", requireRole("owner", "partner"), async (_req, res) => {
  const users = await db.select().from(usersTable);
  validateAndSendArray(res, selectUserSchema, users);
});

router.patch("/users/me/notifications", async (req, res) => {
  const parsed = parseNotificationPreferences(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  validateAndSend(res, selectUserSchema, user);
});

router.get("/users/me", async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  validateAndSend(res, selectUserSchema, user);
});

router.get(
  "/users/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.params.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    validateAndSend(res, selectUserSchema, user);
  },
);

router.post(
  "/users",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    try {
      const [user] = await db.insert(usersTable).values(parsed.data).returning();
      validateAndSend(res, selectUserSchema, user, 201);
    } catch (err: any) {
      if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
        res.status(409).json({ error: "A user with this email already exists" });
        return;
      }
      throw err;
    }
  },
);

router.patch(
  "/users/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, req.params.id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    validateAndSend(res, selectUserSchema, user);
  },
);

router.delete(
  "/users/:id",
  requireRole("owner"),
  async (req, res) => {
    const [user] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, req.params.id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ message: "User deleted" });
  },
);

export default router;
