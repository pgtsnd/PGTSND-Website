import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { projectsTable } from "./projects";

export const phasesTable = pgTable(
  "phases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("phases_project_idx").on(table.projectId),
  ],
);

export const insertPhaseSchema = createInsertSchema(phasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePhaseSchema = insertPhaseSchema
  .omit({ projectId: true })
  .partial();

export const selectPhaseSchema = createSelectSchema(phasesTable);

export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phasesTable.$inferSelect;
