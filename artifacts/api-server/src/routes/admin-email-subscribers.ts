import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";

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

export default router;
