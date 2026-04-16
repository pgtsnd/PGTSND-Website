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
import { projectsTable } from "./projects";

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "sent",
  "signed",
  "expired",
]);

export const contractsTable = pgTable(
  "contracts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    type: varchar("type", { length: 100 }),
    status: contractStatusEnum("status").notNull().default("draft"),
    amount: integer("amount"),
    documentUrl: text("document_url"),
    docusignEnvelopeId: text("docusign_envelope_id"),
    docusignSigningUrl: text("docusign_signing_url"),
    sentAt: timestamp("sent_at"),
    signedAt: timestamp("signed_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("contracts_project_idx").on(table.projectId),
    index("contracts_status_idx").on(table.status),
  ],
);

export const insertContractSchema = createInsertSchema(contractsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContractSchema = insertContractSchema
  .omit({ projectId: true })
  .partial();

export const selectContractSchema = createSelectSchema(contractsTable);

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;
