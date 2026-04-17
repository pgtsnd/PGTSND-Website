import { jsPDF } from "jspdf";
import type { Invoice } from "./api";
import logoUrl from "@assets/logo.webp";

function readStudioEnv(key: string): string | undefined {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const raw = env?.[key];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const STUDIO_INFO: {
  name: string;
  addressLines: string[];
  email: string;
  website: string;
  instagram: string;
  taxId?: string;
  registrationId?: string;
} = {
  name: "PGTSND Productions",
  addressLines: ["Seattle, Washington"],
  email: "hello@pgtsndproductions.com",
  website: "pgtsndproductions.com",
  instagram: "@pgtsndproductions",
  taxId: readStudioEnv("VITE_STUDIO_TAX_ID"),
  registrationId: readStudioEnv("VITE_STUDIO_REGISTRATION_ID"),
};

async function loadLogoPng(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}

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
  receiptUrl?: string | null;
}

export function buildTeamInvoicesCsv(rows: TeamInvoiceExportRow[]): string {
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
    "Receipt URL",
    "Created At",
  ];

  const csvRows = rows.map(({ invoice: inv, clientName, projectName, receiptUrl }) => [
    clientName,
    projectName,
    inv.invoiceNumber ?? inv.id.slice(0, 8),
    inv.description,
    inv.amount.toFixed(2),
    inv.status,
    formatDateForExport(inv.dueDate),
    formatDateForExport(inv.paidAt),
    inv.paymentMethod ?? "",
    receiptUrl ?? "",
    formatDateForExport(inv.createdAt),
  ]);

  return [headers, ...csvRows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");
}

export function exportTeamInvoicesToCsv(rows: TeamInvoiceExportRow[], filename = "invoices.csv"): void {
  const csv = buildTeamInvoicesCsv(rows);
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

export async function generateInvoicePdf(invoice: Invoice, filename?: string): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  let y = margin;

  const logo = await loadLogoPng();
  const logoTargetHeight = 44;
  if (logo) {
    const ratio = logo.width / logo.height;
    const logoWidth = logoTargetHeight * ratio;
    doc.addImage(logo.dataUrl, "PNG", margin, y, logoWidth, logoTargetHeight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.text("INVOICE", pageWidth - margin, y + 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  let infoY = y + 30;
  doc.text(STUDIO_INFO.name, pageWidth - margin, infoY, { align: "right" });
  infoY += 11;
  for (const line of STUDIO_INFO.addressLines) {
    doc.text(line, pageWidth - margin, infoY, { align: "right" });
    infoY += 11;
  }
  doc.text(STUDIO_INFO.email, pageWidth - margin, infoY, { align: "right" });
  infoY += 11;
  doc.text(STUDIO_INFO.website, pageWidth - margin, infoY, { align: "right" });
  if (STUDIO_INFO.taxId) {
    infoY += 11;
    doc.text(`Tax ID: ${STUDIO_INFO.taxId}`, pageWidth - margin, infoY, { align: "right" });
  }
  if (STUDIO_INFO.registrationId) {
    infoY += 11;
    doc.text(`Reg #: ${STUDIO_INFO.registrationId}`, pageWidth - margin, infoY, { align: "right" });
  }

  y = Math.max(y + logoTargetHeight, infoY) + 18;
  doc.setTextColor(20);

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
    doc.setTextColor(20);
    doc.text(`Payment method: ${invoice.paymentMethod}`, margin, y);
  }

  const footerY = pageHeight - margin + 8;
  doc.setDrawColor(230);
  doc.line(margin, footerY - 18, pageWidth - margin, footerY - 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130);
  const footerParts = [STUDIO_INFO.name, ...STUDIO_INFO.addressLines, STUDIO_INFO.email];
  if (STUDIO_INFO.taxId) footerParts.push(`Tax ID ${STUDIO_INFO.taxId}`);
  if (STUDIO_INFO.registrationId) footerParts.push(`Reg # ${STUDIO_INFO.registrationId}`);
  doc.text(footerParts.join(" • "), margin, footerY - 4);
  doc.text(
    `Questions about this invoice? Contact ${STUDIO_INFO.email}`,
    pageWidth - margin,
    footerY + 8,
    { align: "right" },
  );
  doc.text(STUDIO_INFO.website, margin, footerY + 8);

  doc.save(filename ?? `invoice-${number}.pdf`);
}
