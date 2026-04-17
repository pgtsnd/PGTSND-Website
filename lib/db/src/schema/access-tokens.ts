import { pgTable, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { usersTable } from "./users";

export const accessTokenStatusEnum = pgEnum("access_token_status", [
  "active",
  "revoked",
]);

export const accessTokensTable = pgTable("access_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  status: accessTokenStatusEnum("status").notNull().default("active"),
  createdBy: text("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  revokedBy: text("revoked_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export type AccessToken = typeof accessTokensTable.$inferSelect;
