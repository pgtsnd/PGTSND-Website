import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { accessTokensTable, usersTable, insertUserSchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { createAccessToken, revokeAccessToken } from "../lib/access-tokens";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get(
  "/access-tokens",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const rows = await db
      .select({
        id: accessTokensTable.id,
        userId: accessTokensTable.userId,
        label: accessTokensTable.label,
        status: accessTokensTable.status,
        createdAt: accessTokensTable.createdAt,
        lastUsedAt: accessTokensTable.lastUsedAt,
        revokedAt: accessTokensTable.revokedAt,
        createdBy: accessTokensTable.createdBy,
        revokedBy: accessTokensTable.revokedBy,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userRole: usersTable.role,
      })
      .from(accessTokensTable)
      .innerJoin(usersTable, eq(usersTable.id, accessTokensTable.userId))
      .orderBy(desc(accessTokensTable.createdAt));

    res.json(rows);
  },
);

router.post(
  "/access-tokens",
  requireRole("owner", "partner"),
  async (req, res) => {
    try {
      const { userId, label, newUser } = req.body ?? {};

      if (!label || typeof label !== "string" || !label.trim()) {
        res.status(400).json({ error: "Label is required" });
        return;
      }

      let targetUserId: string | undefined;

      if (userId && typeof userId === "string") {
        const [existing] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);
        if (!existing) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        targetUserId = existing.id;
      } else if (newUser && typeof newUser === "object") {
        const parsed = insertUserSchema.safeParse(newUser);
        if (!parsed.success) {
          res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
          return;
        }
        const normalizedEmail = parsed.data.email.toLowerCase().trim();
        const [existingByEmail] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, normalizedEmail))
          .limit(1);
        if (existingByEmail) {
          targetUserId = existingByEmail.id;
        } else {
          const [created] = await db
            .insert(usersTable)
            .values({ ...parsed.data, email: normalizedEmail })
            .returning({ id: usersTable.id });
          targetUserId = created.id;
        }
      } else {
        res.status(400).json({ error: "Either userId or newUser is required" });
        return;
      }

      const issued = await createAccessToken({
        userId: targetUserId!,
        label: label.trim(),
        createdBy: req.user!.id,
      });

      res.status(201).json({
        token: issued.token,
        record: issued.record,
      });
    } catch (err) {
      logger.error({ err }, "Failed to create access token");
      res.status(500).json({ error: "Failed to create access token" });
    }
  },
);

router.post(
  "/access-tokens/:id/revoke",
  requireRole("owner", "partner"),
  async (req, res) => {
    const row = await revokeAccessToken(req.params.id as string, req.user!.id);
    if (!row) {
      res.status(404).json({ error: "Token not found" });
      return;
    }
    res.json(row);
  },
);

export default router;
