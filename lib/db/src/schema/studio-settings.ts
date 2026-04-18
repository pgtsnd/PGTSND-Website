import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const STUDIO_SETTINGS_SINGLETON_ID = "singleton";
export const DEFAULT_DORMANT_TOKEN_THRESHOLD_DAYS = 90;
export const ALLOWED_DORMANT_THRESHOLD_DAYS = [30, 60, 90, 180] as const;

export const studioSettingsTable = pgTable("studio_settings", {
  id: text("id").primaryKey(),
  dormantTokenThresholdDays: integer("dormant_token_threshold_days")
    .notNull()
    .default(DEFAULT_DORMANT_TOKEN_THRESHOLD_DAYS),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const selectStudioSettingsSchema = createSelectSchema(studioSettingsTable);

export const updateStudioSettingsSchema = z.object({
  dormantTokenThresholdDays: z
    .number()
    .int()
    .refine(
      (n) => (ALLOWED_DORMANT_THRESHOLD_DAYS as readonly number[]).includes(n),
      { message: "dormantTokenThresholdDays must be one of 30, 60, 90, 180" },
    )
    .optional(),
});

export type StudioSettings = typeof studioSettingsTable.$inferSelect;
