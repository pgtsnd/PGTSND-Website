import { pgTable, serial, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const magicLinkTokensTable = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  userId: text("user_id").references(() => usersTable.id),
  used: boolean("used").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MagicLinkToken = typeof magicLinkTokensTable.$inferSelect;
