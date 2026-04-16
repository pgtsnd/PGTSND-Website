import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { randomUUID } from "crypto";
import { deliverablesTable } from "./deliverables";

export const reviewRemindersTable = pgTable(
  "review_reminders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverablesTable.id, { onDelete: "cascade" }),
    reminderDay: integer("reminder_day").notNull(),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (table) => [
    index("review_reminders_deliverable_idx").on(table.deliverableId),
  ],
);

export const selectReviewReminderSchema = createSelectSchema(reviewRemindersTable);

export type ReviewReminder = typeof reviewRemindersTable.$inferSelect;
