import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { usersTable } from "./users";

export const invoiceStatusValues = ["draft", "sent", "paid", "overdue", "void"] as const;
export type InvoiceStatusValue = (typeof invoiceStatusValues)[number];

export interface ScheduledInvoiceExportFilters {
  statuses: InvoiceStatusValue[];
  clientId: string | null;
  lookbackMonths: number;
}

export const scheduledInvoiceExportsTable = pgTable(
  "scheduled_invoice_exports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    enabled: boolean("enabled").notNull().default(true),
    filters: jsonb("filters")
      .$type<ScheduledInvoiceExportFilters>()
      .notNull(),
    createdById: text("created_by_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("scheduled_invoice_exports_enabled_idx").on(table.enabled),
  ],
);

export const invoiceExportRunsTable = pgTable(
  "invoice_export_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    scheduledExportId: text("scheduled_export_id").references(
      () => scheduledInvoiceExportsTable.id,
      { onDelete: "set null" },
    ),
    filename: text("filename").notNull(),
    csv: text("csv").notNull(),
    rowCount: integer("row_count").notNull().default(0),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoice_export_runs_created_idx").on(table.createdAt),
  ],
);

export const insertScheduledInvoiceExportSchema = createInsertSchema(
  scheduledInvoiceExportsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export const selectScheduledInvoiceExportSchema = createSelectSchema(
  scheduledInvoiceExportsTable,
);

export const selectInvoiceExportRunSchema = createSelectSchema(
  invoiceExportRunsTable,
);

export type ScheduledInvoiceExport =
  typeof scheduledInvoiceExportsTable.$inferSelect;
export type InvoiceExportRun = typeof invoiceExportRunsTable.$inferSelect;

export const scheduledInvoiceExportFiltersSchema = z.object({
  statuses: z.array(z.enum(invoiceStatusValues)).min(1),
  clientId: z.string().nullable(),
  lookbackMonths: z.number().int().min(1).max(36),
});
