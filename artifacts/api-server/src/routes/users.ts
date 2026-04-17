import { Router } from "express";
import {
  db,
  usersTable,
  insertUserSchema,
  updateUserSchema,
  selectUserSchema,
  distributionListsTable,
  selectDistributionListSchema,
  insertDistributionListBodySchema,
  patchDistributionListBodySchema,
} from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";

const router = Router();

router.get("/users/me/distribution-lists", async (req, res) => {
  const lists = await db
    .select()
    .from(distributionListsTable)
    .where(eq(distributionListsTable.userId, req.user!.id))
    .orderBy(asc(distributionListsTable.name));
  validateAndSendArray(res, selectDistributionListSchema, lists);
});

router.post("/users/me/distribution-lists", async (req, res) => {
  const parsed = insertDistributionListBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (parsed.data.toRecipients.length === 0) {
    res.status(400).json({ error: "At least one To recipient is required" });
    return;
  }
  try {
    const [list] = await db
      .insert(distributionListsTable)
      .values({
        userId: req.user!.id,
        name: parsed.data.name,
        toRecipients: parsed.data.toRecipients,
        ccRecipients: parsed.data.ccRecipients ?? [],
      })
      .returning();
    validateAndSend(res, selectDistributionListSchema, list, 201);
  } catch (err: any) {
    if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
      res.status(409).json({ error: "A list with that name already exists" });
      return;
    }
    throw err;
  }
});

router.patch("/users/me/distribution-lists/:id", async (req, res) => {
  const parsed = patchDistributionListBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (parsed.data.toRecipients && parsed.data.toRecipients.length === 0) {
    res.status(400).json({ error: "At least one To recipient is required" });
    return;
  }
  try {
    const [list] = await db
      .update(distributionListsTable)
      .set(parsed.data)
      .where(
        and(
          eq(distributionListsTable.id, req.params.id),
          eq(distributionListsTable.userId, req.user!.id),
        ),
      )
      .returning();
    if (!list) {
      res.status(404).json({ error: "Distribution list not found" });
      return;
    }
    validateAndSend(res, selectDistributionListSchema, list);
  } catch (err: any) {
    if (err?.message?.includes("duplicate") || err?.message?.includes("unique")) {
      res.status(409).json({ error: "A list with that name already exists" });
      return;
    }
    throw err;
  }
});

router.delete("/users/me/distribution-lists/:id", async (req, res) => {
  const [list] = await db
    .delete(distributionListsTable)
    .where(
      and(
        eq(distributionListsTable.id, req.params.id),
        eq(distributionListsTable.userId, req.user!.id),
      ),
    )
    .returning();
  if (!list) {
    res.status(404).json({ error: "Distribution list not found" });
    return;
  }
  res.json({ message: "Distribution list deleted" });
});

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

router.patch("/users/me/dormant-tokens-email", async (req, res) => {
  const body = (req.body ?? {}) as {
    emailNotifyDormantTokens?: unknown;
    snoozeUntil?: unknown;
  };

  const updates: {
    emailNotifyDormantTokens?: boolean;
    dormantTokensSnoozeUntil?: Date | null;
  } = {};

  if ("emailNotifyDormantTokens" in body) {
    if (typeof body.emailNotifyDormantTokens !== "boolean") {
      res.status(400).json({
        error: "emailNotifyDormantTokens must be a boolean",
      });
      return;
    }
    updates.emailNotifyDormantTokens = body.emailNotifyDormantTokens;
  }

  if ("snoozeUntil" in body) {
    const raw = body.snoozeUntil;
    if (raw === null || raw === "") {
      updates.dormantTokensSnoozeUntil = null;
    } else if (typeof raw === "string") {
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        res
          .status(400)
          .json({ error: "snoozeUntil must be an ISO date string or null" });
        return;
      }
      if (parsed.getTime() < Date.now() - 60_000) {
        res
          .status(400)
          .json({ error: "snoozeUntil must be in the future" });
        return;
      }
      updates.dormantTokensSnoozeUntil = parsed;
    } else {
      res
        .status(400)
        .json({ error: "snoozeUntil must be an ISO date string or null" });
      return;
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  validateAndSend(res, selectUserSchema, user);
});

router.patch("/users/me/bookkeeper-email", async (req, res) => {
  const { bookkeeperEmail } = (req.body ?? {}) as { bookkeeperEmail?: unknown };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let value: string | null;
  if (bookkeeperEmail === null || bookkeeperEmail === "" || bookkeeperEmail === undefined) {
    value = null;
  } else if (typeof bookkeeperEmail === "string") {
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const raw of bookkeeperEmail.split(",")) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (!EMAIL_RE.test(trimmed)) {
        res.status(400).json({ error: `Invalid email address: ${trimmed}` });
        return;
      }
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      parts.push(trimmed);
    }
    if (parts.length === 0) {
      value = null;
    } else if (parts.length > 10) {
      res.status(400).json({ error: "Too many bookkeeper email addresses (limit 10)" });
      return;
    } else {
      const joined = parts.join(", ");
      if (joined.length > 255) {
        res.status(400).json({ error: "Bookkeeper email list is too long (max 255 characters)" });
        return;
      }
      value = joined;
    }
  } else {
    res.status(400).json({ error: "bookkeeperEmail must be a valid email address (or comma-separated list) or empty" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ bookkeeperEmail: value })
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
