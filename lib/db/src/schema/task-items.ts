import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { tasksTable } from "./tasks";

export const taskItemsTable = pgTable(
  "task_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("task_items_task_idx").on(table.taskId)],
);

export const insertTaskItemSchema = createInsertSchema(taskItemsTable).omit({
  id: true,
  createdAt: true,
});

export const updateTaskItemSchema = insertTaskItemSchema
  .omit({ taskId: true })
  .partial();

export const selectTaskItemSchema = createSelectSchema(taskItemsTable);

export type InsertTaskItem = z.infer<typeof insertTaskItemSchema>;
export type TaskItem = typeof taskItemsTable.$inferSelect;
