import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { usersTable } from "./users";

export const distributionListsTable = pgTable(
  "distribution_lists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    toRecipients: jsonb("to_recipients").$type<string[]>().notNull().default([]),
    ccRecipients: jsonb("cc_recipients").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("distribution_lists_user_idx").on(table.userId),
    uniqueIndex("distribution_lists_user_name_idx").on(table.userId, table.name),
  ],
);

export const selectDistributionListSchema = createSelectSchema(
  distributionListsTable,
);

export type DistributionList = typeof distributionListsTable.$inferSelect;

export const distributionListNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const distributionListEmailsSchema = z
  .array(z.string().trim().toLowerCase().email().max(320))
  .max(50);

export const insertDistributionListBodySchema = z.object({
  name: distributionListNameSchema,
  toRecipients: distributionListEmailsSchema,
  ccRecipients: distributionListEmailsSchema.optional().default([]),
});

export const patchDistributionListBodySchema = z
  .object({
    name: distributionListNameSchema.optional(),
    toRecipients: distributionListEmailsSchema.optional(),
    ccRecipients: distributionListEmailsSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "No fields to update",
  });
