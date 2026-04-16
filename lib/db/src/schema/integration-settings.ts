import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";

export const integrationTypeEnum = pgEnum("integration_type", [
  "stripe",
  "google_drive",
  "slack",
  "docusign",
]);

export const integrationSettingsTable = pgTable(
  "integration_settings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    type: integrationTypeEnum("type").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    config: jsonb("config").$type<Record<string, string>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("integration_settings_type_idx").on(table.type),
  ],
);

export const insertIntegrationSettingsSchema = createInsertSchema(integrationSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateIntegrationSettingsSchema = insertIntegrationSettingsSchema.partial();

export const selectIntegrationSettingsSchema = createSelectSchema(integrationSettingsTable);

export type InsertIntegrationSettings = z.infer<typeof insertIntegrationSettingsSchema>;
export type IntegrationSettings = typeof integrationSettingsTable.$inferSelect;
