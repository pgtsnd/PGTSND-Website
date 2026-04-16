import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "blocked",
]);

export const tasksTable = pgTable(
  "tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    assigneeId: text("assignee_id").references(() => usersTable.id),
    progress: integer("progress").notNull().default(0),
    dueDate: timestamp("due_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    dependsOnTaskId: text("depends_on_task_id").references((): AnyPgColumn => tasksTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_project_idx").on(table.projectId),
    index("tasks_assignee_idx").on(table.assigneeId),
    index("tasks_status_idx").on(table.status),
  ],
);

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = insertTaskSchema
  .omit({ projectId: true })
  .partial();

export const selectTaskSchema = createSelectSchema(tasksTable);

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
