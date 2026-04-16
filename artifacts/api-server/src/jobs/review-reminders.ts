import {
  db,
  deliverablesTable,
  reviewRemindersTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const MILESTONE_DAYS = [3, 5, 7];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export async function processReviewReminders() {
  const pendingDeliverables = await db
    .select()
    .from(deliverablesTable)
    .where(
      inArray(deliverablesTable.status, ["in_review", "pending"]),
    );

  const now = new Date();

  for (const deliverable of pendingDeliverables) {
    if (!deliverable.submittedAt) continue;

    const daysSinceSubmission = Math.floor(
      (now.getTime() - deliverable.submittedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const existingReminders = await db
      .select()
      .from(reviewRemindersTable)
      .where(eq(reviewRemindersTable.deliverableId, deliverable.id));

    const sentDays = new Set(existingReminders.map((r) => r.reminderDay));
    const hasTodayReminder = existingReminders.some((r) =>
      isSameDay(new Date(r.sentAt), now),
    );

    if (hasTodayReminder) continue;

    if (daysSinceSubmission >= 7) {
      if (!sentDays.has(7)) {
        await db.insert(reviewRemindersTable).values({
          deliverableId: deliverable.id,
          reminderDay: 7,
        });
        sentDays.add(7);
        logger.info(
          { deliverableId: deliverable.id, day: 7, title: deliverable.title },
          "Review reminder sent (day 7 milestone)",
        );
      }

      for (const day of [3, 5]) {
        if (!sentDays.has(day)) {
          await db.insert(reviewRemindersTable).values({
            deliverableId: deliverable.id,
            reminderDay: day,
          });
          sentDays.add(day);
        }
      }

      if (daysSinceSubmission > 7) {
        await db.insert(reviewRemindersTable).values({
          deliverableId: deliverable.id,
          reminderDay: daysSinceSubmission,
        });
        logger.info(
          { deliverableId: deliverable.id, day: daysSinceSubmission, title: deliverable.title },
          `Daily review reminder sent (day ${daysSinceSubmission})`,
        );
      }
    } else {
      for (const day of MILESTONE_DAYS) {
        if (daysSinceSubmission >= day && !sentDays.has(day)) {
          await db.insert(reviewRemindersTable).values({
            deliverableId: deliverable.id,
            reminderDay: day,
          });
          sentDays.add(day);
          logger.info(
            { deliverableId: deliverable.id, day, title: deliverable.title },
            `Review reminder sent (day ${day})`,
          );
        }
      }
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderJob(intervalMs = 60 * 60 * 1000) {
  logger.info("Starting review reminder job");
  processReviewReminders().catch((err) =>
    logger.error({ err }, "Failed to process review reminders"),
  );

  intervalId = setInterval(() => {
    processReviewReminders().catch((err) =>
      logger.error({ err }, "Failed to process review reminders"),
    );
  }, intervalMs);
}

export function stopReminderJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
