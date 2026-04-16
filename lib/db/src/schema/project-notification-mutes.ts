import {
  pgTable,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const projectNotificationMutesTable = pgTable(
  "project_notification_mutes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectId] })],
);

export const selectProjectNotificationMuteSchema = createSelectSchema(
  projectNotificationMutesTable,
);

export type ProjectNotificationMute =
  typeof projectNotificationMutesTable.$inferSelect;
