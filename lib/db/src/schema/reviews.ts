import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { deliverablesTable } from "./deliverables";
import { usersTable } from "./users";

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "revision_requested",
]);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverablesTable.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => usersTable.id),
    status: reviewStatusEnum("status").notNull().default("pending"),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("reviews_deliverable_idx").on(table.deliverableId),
    index("reviews_reviewer_idx").on(table.reviewerId),
  ],
);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReviewSchema = insertReviewSchema
  .omit({ deliverableId: true, reviewerId: true })
  .partial();

export const selectReviewSchema = createSelectSchema(reviewsTable);

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
