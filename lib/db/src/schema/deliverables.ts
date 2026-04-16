import {
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { projectsTable } from "./projects";
import { tasksTable } from "./tasks";

export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "video",
  "graphics",
  "document",
  "audio",
  "other",
]);

export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "draft",
  "pending",
  "in_review",
  "approved",
  "revision_requested",
]);

export const deliverablesTable = pgTable(
  "deliverables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasksTable.id),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: deliverableTypeEnum("type").notNull().default("other"),
    status: deliverableStatusEnum("status").notNull().default("draft"),
    fileUrl: text("file_url"),
    version: varchar("version", { length: 50 }).default("v1"),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("deliverables_project_idx").on(table.projectId),
    index("deliverables_status_idx").on(table.status),
  ],
);

export const insertDeliverableSchema = createInsertSchema(
  deliverablesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDeliverableSchema = insertDeliverableSchema
  .omit({ projectId: true })
  .partial();

export const selectDeliverableSchema = createSelectSchema(deliverablesTable);

export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Deliverable = typeof deliverablesTable.$inferSelect;
