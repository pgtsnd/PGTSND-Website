import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get(
  "/admin/dormant-tokens-subscribers",
  requireRole("owner"),
  async (_req, res) => {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        emailNotifyDormantTokens: usersTable.emailNotifyDormantTokens,
        dormantTokensSnoozeUntil: usersTable.dormantTokensSnoozeUntil,
        dormantTokensUnsubscribedAt: usersTable.dormantTokensUnsubscribedAt,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"))
      .orderBy(asc(usersTable.email));

    const now = Date.now();
    const owners = rows.map((r) => {
      const snoozeActive =
        r.dormantTokensSnoozeUntil !== null &&
        r.dormantTokensSnoozeUntil.getTime() > now;
      let status: "subscribed" | "snoozed" | "unsubscribed";
      if (!r.emailNotifyDormantTokens) {
        status = "unsubscribed";
      } else if (snoozeActive) {
        status = "snoozed";
      } else {
        status = "subscribed";
      }
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        emailNotifyDormantTokens: r.emailNotifyDormantTokens,
        snoozeUntil: r.dormantTokensSnoozeUntil
          ? r.dormantTokensSnoozeUntil.toISOString()
          : null,
        unsubscribedAt: r.dormantTokensUnsubscribedAt
          ? r.dormantTokensUnsubscribedAt.toISOString()
          : null,
        status,
      };
    });

    res.json({ owners });
  },
);

router.post(
  "/admin/dormant-tokens-subscribers/:id/resubscribe",
  requireRole("owner"),
  async (req, res) => {
    const targetId = req.params.id;

    const [existing] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        emailNotifyDormantTokens: usersTable.emailNotifyDormantTokens,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, targetId), eq(usersTable.role, "owner")))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Owner not found" });
      return;
    }

    if (existing.emailNotifyDormantTokens) {
      res.status(409).json({ error: "Owner is already subscribed" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        emailNotifyDormantTokens: true,
        dormantTokensUnsubscribedAt: null,
        dormantTokensSnoozeUntil: null,
      })
      .where(and(eq(usersTable.id, targetId), eq(usersTable.role, "owner")))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
      });

    if (!updated) {
      res.status(404).json({ error: "Owner not found" });
      return;
    }

    logger.info(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        targetUserId: updated.id,
        targetEmail: updated.email,
        action: "dormant-tokens.resubscribe",
      },
      "Admin re-subscribed owner to dormant-tokens email",
    );

    res.json({ ok: true, id: updated.id });
  },
);

export default router;
