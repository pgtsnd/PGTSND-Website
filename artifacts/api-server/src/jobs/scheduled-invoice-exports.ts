import {
  db,
  invoicesTable,
  projectsTable,
  organizationsTable,
  usersTable,
  scheduledInvoiceExportsTable,
  invoiceExportRunsTable,
  type Invoice,
  type ScheduledInvoiceExport,
  type ScheduledInvoiceExportFilters,
} from "@workspace/db";
import { and, eq, gte, lte, inArray, type SQL } from "drizzle-orm";
import { logger } from "../lib/logger";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

interface ExportRow {
  invoice: Invoice;
  clientName: string;
  projectName: string;
}

export async function buildInvoiceCsv(
  filters: ScheduledInvoiceExportFilters,
  periodStart: Date | null,
  periodEnd: Date | null,
): Promise<{ csv: string; rowCount: number }> {
  const conditions: SQL[] = [];
  if (filters.statuses.length > 0) {
    conditions.push(inArray(invoicesTable.status, filters.statuses));
  }
  if (periodStart) conditions.push(gte(invoicesTable.createdAt, periodStart));
  if (periodEnd) conditions.push(lte(invoicesTable.createdAt, periodEnd));

  const baseQuery = db
    .select({
      invoice: invoicesTable,
      project: projectsTable,
      orgName: organizationsTable.name,
      clientUserName: usersTable.name,
    })
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(
      organizationsTable,
      eq(projectsTable.organizationId, organizationsTable.id),
    )
    .leftJoin(usersTable, eq(projectsTable.clientId, usersTable.id));

  const rows =
    conditions.length > 0
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

  const filtered: ExportRow[] = [];
  for (const r of rows) {
    if (!r.project) continue;
    const clientName =
      r.orgName ?? r.clientUserName ?? "Unknown client";
    if (filters.clientId) {
      const projectClientId =
        r.project.organizationId ?? r.project.clientId ?? null;
      if (projectClientId !== filters.clientId) continue;
    }
    filtered.push({
      invoice: r.invoice,
      clientName,
      projectName: r.project.name,
    });
  }

  const headers = [
    "Client",
    "Project",
    "Invoice Number",
    "Description",
    "Amount",
    "Status",
    "Due Date",
    "Paid At",
    "Payment Method",
    "Created At",
  ];

  const csvRows = filtered.map(({ invoice, clientName, projectName }) => [
    clientName,
    projectName,
    invoice.invoiceNumber ?? invoice.id.slice(0, 8),
    invoice.description,
    invoice.amount.toFixed(2),
    invoice.status,
    formatDate(invoice.dueDate),
    formatDate(invoice.paidAt),
    invoice.paymentMethod ?? "",
    formatDate(invoice.createdAt),
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  return { csv: `\uFEFF${csv}`, rowCount: filtered.length };
}

function isFirstOfMonth(now: Date): boolean {
  return now.getUTCDate() === 1;
}

function alreadyRanThisMonth(
  lastRunAt: Date | null,
  now: Date,
): boolean {
  if (!lastRunAt) return false;
  return (
    lastRunAt.getUTCFullYear() === now.getUTCFullYear() &&
    lastRunAt.getUTCMonth() === now.getUTCMonth()
  );
}

export async function runScheduledInvoiceExports(now: Date = new Date()) {
  if (!isFirstOfMonth(now)) return { ran: 0 };

  const schedules = await db
    .select()
    .from(scheduledInvoiceExportsTable)
    .where(eq(scheduledInvoiceExportsTable.enabled, true));

  let ran = 0;
  for (const schedule of schedules) {
    if (alreadyRanThisMonth(schedule.lastRunAt, now)) continue;
    try {
      await executeScheduledExport(schedule, now);
      ran++;
    } catch (err) {
      logger.error(
        { err, scheduleId: schedule.id },
        "Scheduled invoice export failed",
      );
    }
  }
  return { ran };
}

export async function executeScheduledExport(
  schedule: ScheduledInvoiceExport,
  now: Date = new Date(),
) {
  const filters = schedule.filters;
  const lookback = filters.lookbackMonths ?? 1;
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0) - 1,
  );
  const periodStart = new Date(
    Date.UTC(
      periodEnd.getUTCFullYear(),
      periodEnd.getUTCMonth() - (lookback - 1),
      1,
      0,
      0,
      0,
      0,
    ),
  );

  const { csv, rowCount } = await buildInvoiceCsv(
    filters,
    periodStart,
    periodEnd,
  );

  const stamp = `${periodStart.getUTCFullYear()}-${String(periodStart.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `invoices-${stamp}.csv`;

  const [run] = await db
    .insert(invoiceExportRunsTable)
    .values({
      scheduledExportId: schedule.id,
      filename,
      csv,
      rowCount,
      periodStart,
      periodEnd,
    })
    .returning();

  await db
    .update(scheduledInvoiceExportsTable)
    .set({ lastRunAt: now })
    .where(eq(scheduledInvoiceExportsTable.id, schedule.id));

  logger.info(
    { scheduleId: schedule.id, runId: run.id, rowCount, filename },
    "Scheduled invoice export generated",
  );
  return run;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduledExportJob(intervalMs = 60 * 60 * 1000) {
  logger.info("Starting scheduled invoice export job");
  runScheduledInvoiceExports().catch((err) =>
    logger.error({ err }, "Initial scheduled invoice export run failed"),
  );
  intervalId = setInterval(() => {
    runScheduledInvoiceExports().catch((err) =>
      logger.error({ err }, "Scheduled invoice export tick failed"),
    );
  }, intervalMs);
}

export function stopScheduledExportJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
