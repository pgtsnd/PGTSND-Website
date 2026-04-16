import { jsPDF } from "jspdf";
import type { Invoice } from "./api";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDateForExport(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export interface TeamInvoiceExportRow {
  invoice: Invoice;
  clientName: string;
  projectName: string;
}

export function exportTeamInvoicesToCsv(rows: TeamInvoiceExportRow[], filename = "invoices.csv"): void {
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

  const csvRows = rows.map(({ invoice: inv, clientName, projectName }) => [
    clientName,
    projectName,
    inv.invoiceNumber ?? inv.id.slice(0, 8),
    inv.description,
    inv.amount.toFixed(2),
    inv.status,
    formatDateForExport(inv.dueDate),
    formatDateForExport(inv.paidAt),
    inv.paymentMethod ?? "",
    formatDateForExport(inv.createdAt),
  ]);

  const csv = [headers, ...csvRows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export function exportInvoicesToCsv(invoices: Invoice[], filename = "invoices.csv"): void {
  const headers = [
    "Invoice Number",
    "Description",
    "Amount",
    "Status",
    "Due Date",
    "Paid At",
    "Payment Method",
    "Created At",
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber ?? inv.id.slice(0, 8),
    inv.description,
    inv.amount.toFixed(2),
    inv.status,
    formatDateForExport(inv.dueDate),
    formatDateForExport(inv.paidAt),
    inv.paymentMethod ?? "",
    formatDateForExport(inv.createdAt),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export function generateInvoicePdf(invoice: Invoice, filename?: string): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("PGTSND Productions", pageWidth - margin, y - 4, { align: "right" });
  y += 36;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  const number = invoice.invoiceNumber ?? invoice.id.slice(0, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Invoice Number", margin, y);
  doc.text("Status", pageWidth - margin - 120, y);
  doc.setFont("helvetica", "normal");
  doc.text(number, margin, y + 16);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin - 120, y + 16);
  y += 44;

  doc.setFont("helvetica", "bold");
  doc.text("Issued", margin, y);
  doc.text("Due Date", margin + 180, y);
  if (invoice.paidAt) {
    doc.text("Paid", margin + 360, y);
  }
  doc.setFont("helvetica", "normal");
  doc.text(formatDateForExport(invoice.createdAt) || "—", margin, y + 16);
  doc.text(formatDateForExport(invoice.dueDate) || "—", margin + 180, y + 16);
  if (invoice.paidAt) {
    doc.text(formatDateForExport(invoice.paidAt), margin + 360, y + 16);
  }
  y += 50;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.text("Description", margin, y);
  doc.text("Amount", pageWidth - margin, y, { align: "right" });
  y += 18;

  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(invoice.description || "—", pageWidth - margin * 2 - 100);
  doc.text(descLines, margin, y);
  doc.text(`$${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, y, { align: "right" });
  y += descLines.length * 14 + 24;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", pageWidth - margin - 140, y);
  doc.text(`$${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, y, { align: "right" });

  if (invoice.paymentMethod) {
    y += 32;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Payment method: ${invoice.paymentMethod}`, margin, y);
  }

  doc.save(filename ?? `invoice-${number}.pdf`);
}
