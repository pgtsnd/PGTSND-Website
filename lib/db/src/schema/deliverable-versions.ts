import {
  pgTable,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { deliverablesTable } from "./deliverables";
import { usersTable } from "./users";

export const deliverableVersionsTable = pgTable(
  "deliverable_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverablesTable.id, { onDelete: "cascade" }),
    version: varchar("version", { length: 50 }).notNull(),
    fileUrl: text("file_url").notNull(),
    uploadedById: text("uploaded_by_id").references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("deliverable_versions_deliverable_idx").on(table.deliverableId),
  ],
);

export const insertDeliverableVersionSchema = createInsertSchema(
  deliverableVersionsTable,
).omit({
  id: true,
  createdAt: true,
});

export const selectDeliverableVersionSchema = createSelectSchema(
  deliverableVersionsTable,
);

export type InsertDeliverableVersion = z.infer<
  typeof insertDeliverableVersionSchema
>;
export type DeliverableVersion = typeof deliverableVersionsTable.$inferSelect;
