import {
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { deliverablesTable } from "./deliverables";
import { usersTable } from "./users";

export const reviewLinksTable = pgTable(
  "review_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverablesTable.id, { onDelete: "cascade" }),
    token: text("token")
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "")),
    createdBy: text("created_by")
      .notNull()
      .references(() => usersTable.id),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("review_links_token_idx").on(table.token),
    index("review_links_deliverable_idx").on(table.deliverableId),
  ],
);

export const insertReviewLinkSchema = createInsertSchema(reviewLinksTable).omit({
  id: true,
  token: true,
  createdAt: true,
});

export const selectReviewLinkSchema = createSelectSchema(reviewLinksTable);

export type ReviewLink = typeof reviewLinksTable.$inferSelect;
export type InsertReviewLink = z.infer<typeof insertReviewLinkSchema>;
