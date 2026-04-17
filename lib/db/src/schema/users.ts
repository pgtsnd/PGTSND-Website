import { pgTable, text, timestamp, varchar, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "partner",
  "crew",
  "client",
]);

export const usersTable = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: userRoleEnum("role").notNull().default("crew"),
  googleId: varchar("google_id", { length: 255 }),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 50 }),
  title: varchar("title", { length: 255 }),
  initials: varchar("initials", { length: 5 }),

  dayRate: integer("day_rate"),
  halfDayRate: integer("half_day_rate"),
  hourlyRate: integer("hourly_rate"),
  rateNotes: text("rate_notes"),

  w9OnFile: boolean("w9_on_file").default(false),
  taxClassification: varchar("tax_classification", { length: 50 }),
  ein: varchar("ein", { length: 20 }),

  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),

  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 100 }),

  equipment: text("equipment"),
  specialties: text("specialties"),
  portfolio: varchar("portfolio", { length: 500 }),
  availability: text("availability"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),

  emailNotifyReviews: boolean("email_notify_reviews").notNull().default(true),
  emailNotifyComments: boolean("email_notify_comments").notNull().default(true),
  emailNotifyDormantTokens: boolean("email_notify_dormant_tokens")
    .notNull()
    .default(true),
  dormantTokensSnoozeUntil: timestamp("dormant_tokens_snooze_until"),
  dormantTokensUnsubscribedAt: timestamp("dormant_tokens_unsubscribed_at"),

  bookkeeperEmail: varchar("bookkeeper_email", { length: 255 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = insertUserSchema
  .omit({ email: true, role: true })
  .partial();

export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
