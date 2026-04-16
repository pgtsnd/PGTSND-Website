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

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
]);

export const invoicesTable = pgTable(
  "invoices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    invoiceNumber: varchar("invoice_number", { length: 50 }),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    paymentMethod: varchar("payment_method", { length: 100 }),
    stripeHostedUrl: text("stripe_hosted_url"),
    stripePdfUrl: text("stripe_pdf_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoices_project_idx").on(table.projectId),
    index("invoices_status_idx").on(table.status),
    index("invoices_stripe_id_idx").on(table.stripeInvoiceId),
  ],
);

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateInvoiceSchema = insertInvoiceSchema
  .omit({ projectId: true })
  .partial();

export const selectInvoiceSchema = createSelectSchema(invoicesTable);

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
