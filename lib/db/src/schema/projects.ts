import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const projectStatusEnum = pgEnum("project_status", [
  "lead",
  "active",
  "in_progress",
  "review",
  "delivered",
  "archived",
]);

export const projectPhaseEnum = pgEnum("project_phase", [
  "pre_production",
  "production",
  "post_production",
  "review",
  "delivered",
]);

export const projectsTable = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("lead"),
    phase: projectPhaseEnum("phase").notNull().default("pre_production"),
    organizationId: text("organization_id").references(
      () => organizationsTable.id,
    ),
    clientId: text("client_id").references(() => usersTable.id),
    progress: integer("progress").notNull().default(0),
    dueDate: timestamp("due_date"),
    startDate: timestamp("start_date"),
    budget: integer("budget"),
    thumbnail: text("thumbnail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_status_idx").on(table.status),
    index("projects_organization_idx").on(table.organizationId),
    index("projects_client_idx").on(table.clientId),
  ],
);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = insertProjectSchema.partial();

export const selectProjectSchema = createSelectSchema(projectsTable);

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
