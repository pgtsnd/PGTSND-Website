import {
  db,
  accessTokensTable,
  usersTable,
  dormantTokenSummaryRunsTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { sendEmail, getAppBaseUrl } from "../services/email";
import {
  renderDormantTokensSummaryEmail,
  type DormantTokenRowInput,
} from "../services/email-templates";
import { createUnsubscribeToken } from "../lib/unsubscribe-token";

// Keep this in sync with DORMANT_THRESHOLD_DAYS in
// artifacts/pgtsnd-website/src/pages/TeamAccess.tsx so the email and the
// in-app badge agree on what counts as dormant.
export const DORMANT_THRESHOLD_DAYS = 90;
const DORMANT_THRESHOLD_MS = DORMANT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface DormantTokenRow extends DormantTokenRowInput {
  tokenId: string;
  lastActivityAt: Date;
}

function formatLastActivity(
  lastUsedAt: Date | null,
  createdAt: Date,
  now: Date,
): string {
  const reference = lastUsedAt ?? createdAt;
  const days = Math.floor((now.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000));
  const dateLabel = reference.toISOString().slice(0, 10);
  if (!lastUsedAt) {
    return `Never used · created ${dateLabel} (${days}d ago)`;
  }
  return `${dateLabel} (${days}d ago)`;
}

export async function findDormantAccessTokens(
  now: Date = new Date(),
): Promise<DormantTokenRow[]> {
  const rows = await db
    .select({
      id: accessTokensTable.id,
      label: accessTokensTable.label,
      createdAt: accessTokensTable.createdAt,
      lastUsedAt: accessTokensTable.lastUsedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(accessTokensTable)
    .innerJoin(usersTable, eq(usersTable.id, accessTokensTable.userId))
    .where(eq(accessTokensTable.status, "active"));

  const cutoff = now.getTime() - DORMANT_THRESHOLD_MS;
  const dormant: DormantTokenRow[] = [];
  for (const r of rows) {
    const reference = r.lastUsedAt ?? r.createdAt;
    if (!reference) continue;
    if (reference.getTime() > cutoff) continue;
    dormant.push({
      tokenId: r.id,
      userName: r.userName,
      userEmail: r.userEmail,
      label: r.label,
      lastActivityAt: reference,
      lastActivityLabel: formatLastActivity(r.lastUsedAt, r.createdAt, now),
    });
  }

  // Sort: oldest activity first (most stale at top), tie-broken by label.
  dormant.sort((a, b) => {
    const diff = a.lastActivityAt.getTime() - b.lastActivityAt.getTime();
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label);
  });
  return dormant;
}

export interface OwnerRecipient {
  id: string;
  email: string;
  name: string | null;
}

export async function findOwnerRecipients(
  now: Date = new Date(),
): Promise<OwnerRecipient[]> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      emailNotifyDormantTokens: usersTable.emailNotifyDormantTokens,
      dormantTokensSnoozeUntil: usersTable.dormantTokensSnoozeUntil,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "owner"));

  return rows
    .filter((r) => {
      if (r.emailNotifyDormantTokens === false) return false;
      if (
        r.dormantTokensSnoozeUntil &&
        r.dormantTokensSnoozeUntil.getTime() > now.getTime()
      ) {
        return false;
      }
      return true;
    })
    .map((r) => ({ id: r.id, email: r.email, name: r.name }));
}

async function lastSummarySentAt(): Promise<Date | null> {
  const [row] = await db
    .select({ sentAt: dormantTokenSummaryRunsTable.sentAt })
    .from(dormantTokenSummaryRunsTable)
    .orderBy(desc(dormantTokenSummaryRunsTable.sentAt))
    .limit(1);
  return row?.sentAt ?? null;
}

export interface RunDormantSummaryResult {
  ran: boolean;
  reason?: "too-soon" | "no-dormant" | "no-recipients";
  recipientCount?: number;
  tokenCount?: number;
}

export async function runDormantTokenSummary(
  now: Date = new Date(),
): Promise<RunDormantSummaryResult> {
  const last = await lastSummarySentAt();
  if (last && now.getTime() - last.getTime() < WEEK_MS) {
    return { ran: false, reason: "too-soon" };
  }

  const dormant = await findDormantAccessTokens(now);
  if (dormant.length === 0) {
    // Per spec: if there are no dormant tokens, no email is sent — and we
    // also don't record a run, so we'll re-check on the next tick.
    return { ran: false, reason: "no-dormant" };
  }

  const recipients = await findOwnerRecipients(now);
  if (recipients.length === 0) {
    return { ran: false, reason: "no-recipients" };
  }

  const baseUrl = getAppBaseUrl().replace(/\/+$/, "");
  const link = `${baseUrl}/team/access`;
  const managePreferencesUrl = `${baseUrl}/team/settings?section=notifications`;
  const subject = `Weekly access-token review: ${dormant.length} dormant token${dormant.length === 1 ? "" : "s"}`;

  let sent = 0;
  for (const recipient of recipients) {
    const unsubscribeToken = createUnsubscribeToken(
      "dormant-tokens",
      recipient.id,
    );
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(unsubscribeToken)}`;

    const text = [
      `${dormant.length} active access token${dormant.length === 1 ? "" : "s"} ${dormant.length === 1 ? "has" : "have"} not been used in over ${DORMANT_THRESHOLD_DAYS} days:`,
      "",
      ...dormant.map(
        (t) =>
          `- ${t.userName ? `${t.userName} <${t.userEmail}>` : t.userEmail} — "${t.label}" — ${t.lastActivityLabel}`,
      ),
      "",
      `Review and revoke at: ${link}`,
      "",
      `Unsubscribe from this email: ${unsubscribeUrl}`,
      `Manage email preferences: ${managePreferencesUrl}`,
      "",
      "— PGTSND Productions",
    ].join("\n");

    try {
      const html = renderDormantTokensSummaryEmail({
        recipientName: recipient.name,
        thresholdDays: DORMANT_THRESHOLD_DAYS,
        tokens: dormant,
        link,
        unsubscribeUrl,
        managePreferencesUrl,
      });
      const result = await sendEmail({
        to: recipient.email,
        subject,
        text,
        html,
      });
      if (result.ok) {
        sent += 1;
      } else {
        logger.error(
          { to: recipient.email, error: result.error },
          "Dormant token summary email failed",
        );
      }
    } catch (err) {
      logger.error(
        { err, to: recipient.email },
        "Dormant token summary email threw",
      );
    }
  }

  if (sent === 0) {
    // Every send failed — don't record the run, so we'll retry on the next
    // tick instead of suppressing delivery for a full week.
    logger.warn(
      { attempted: recipients.length, tokenCount: dormant.length },
      "Dormant access-token summary: all sends failed; not recording run",
    );
    return {
      ran: false,
      reason: "no-recipients",
      recipientCount: 0,
      tokenCount: dormant.length,
    };
  }

  await db.insert(dormantTokenSummaryRunsTable).values({
    sentAt: now,
    recipientCount: sent,
    tokenCount: dormant.length,
  });

  logger.info(
    { recipientCount: sent, tokenCount: dormant.length },
    "Dormant access-token summary dispatched",
  );

  return {
    ran: true,
    recipientCount: sent,
    tokenCount: dormant.length,
  };
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startDormantTokenSummaryJob(
  intervalMs = 60 * 60 * 1000,
) {
  logger.info("Starting dormant access-token summary job");
  runDormantTokenSummary().catch((err) =>
    logger.error({ err }, "Initial dormant token summary run failed"),
  );
  intervalId = setInterval(() => {
    runDormantTokenSummary().catch((err) =>
      logger.error({ err }, "Dormant token summary tick failed"),
    );
  }, intervalMs);
}

export function stopDormantTokenSummaryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
