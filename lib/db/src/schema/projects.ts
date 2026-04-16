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
    driveFolderId: text("drive_folder_id"),
    slackChannelId: text("slack_channel_id"),
    projectType: varchar("project_type", { length: 80 }),
    priority: varchar("priority", { length: 20 }).notNull().default("normal"),
    scope: text("scope"),
    goals: text("goals"),
    targetAudience: text("target_audience"),
    deliverablesPlan: text("deliverables_plan"),
    shootLocation: text("shoot_location"),
    keyContact: varchar("key_contact", { length: 200 }),
    referenceLinks: text("reference_links"),
    internalNotes: text("internal_notes"),
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
