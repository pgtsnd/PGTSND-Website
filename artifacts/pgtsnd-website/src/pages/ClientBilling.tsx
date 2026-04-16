import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Invoice } from "../lib/api";

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientBilling() {
  const { t } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    api
      .getClientInvoices()
      .then(setInvoices)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const dueInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const totalDue = dueInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Paid";
      case "sent": return "Due";
      case "overdue": return "Overdue";
      case "draft": return "Draft";
      case "void": return "Void";
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return { color: "rgba(96,208,96,0.8)", bg: "rgba(96,208,96,0.08)" };
      case "overdue": return { color: "rgba(255,120,120,0.8)", bg: "rgba(255,120,120,0.08)" };
      default: return { color: "rgba(255,200,60,0.8)", bg: "rgba(255,200,60,0.08)" };
    }
  };

  const handlePayClick = (invoice: Invoice) => {
    if (invoice.stripeHostedUrl) {
      window.open(invoice.stripeHostedUrl, "_blank");
    } else {
      setSelectedInvoice(invoice);
      setShowPayModal(true);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: t.textTertiary }}>Loading...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: "rgba(255,100,100,0.8)" }}>{error}</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Billing</h1>
          {invoices.length > 0 && (
            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export All
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <div style={{ padding: "20px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Total Paid</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "24px", color: "rgba(96,208,96,0.8)" }}>${totalPaid.toLocaleString()}</p>
          </div>
          <div style={{ padding: "20px 24px", background: t.bgCard, border: `1px solid ${totalDue > 0 ? "rgba(255,200,60,0.15)" : t.border}`, borderRadius: "10px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Outstanding</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "24px", color: totalDue > 0 ? "rgba(255,200,60,0.9)" : t.text }}>${totalDue.toLocaleString()}</p>
          </div>
          <div style={{ padding: "20px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Total Invoices</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "24px", color: t.text }}>{invoices.length}</p>
          </div>
        </div>

        {totalDue > 0 && (
          <div style={{ background: "rgba(255,200,60,0.03)", border: "1px solid rgba(255,200,60,0.1)", borderRadius: "10px", padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>You have ${totalDue.toLocaleString()} due across {dueInvoices.length} invoice{dueInvoices.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {invoices.length === 0 ? (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" }}>No invoices yet</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Invoices will appear here when your team sends them.</p>
          </div>
        ) : (
          <>
            {dueInvoices.length > 0 && (
              <div style={{ marginBottom: "40px" }}>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Outstanding Invoices</h2>
                <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 100px 120px", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.hoverBg }}>
                    {["Invoice", "Description", "Amount", "Due Date", "Status", ""].map((h) => (
                      <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted }}>{h}</p>
                    ))}
                  </div>
                  {dueInvoices.map((inv) => {
                    const sc = statusColor(inv.status);
                    return (
                      <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 100px 120px", padding: "16px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{inv.invoiceNumber || inv.id.slice(0, 8)}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary }}>{inv.description}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text }}>${inv.amount.toLocaleString()}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{formatDate(inv.dueDate)}</p>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: sc.color, background: sc.bg, padding: "4px 12px", borderRadius: "4px", textAlign: "center", display: "inline-block" }}>{statusLabel(inv.status)}</span>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button onClick={() => handlePayClick(inv)} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "6px 16px", cursor: "pointer" }}>Pay Now</button>
                          {inv.stripePdfUrl && (
                            <a href={inv.stripePdfUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", display: "flex", alignItems: "center" }}>PDF</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {paidInvoices.length > 0 && (
              <div>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Payment History</h2>
                <div>
                  {paidInvoices.map((payment, i) => (
                    <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < paidInvoices.length - 1 ? `1px solid ${t.borderSubtle}` : "none" }}>
                      <div>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.textSecondary, marginBottom: "2px" }}>{payment.invoiceNumber ? `${payment.invoiceNumber} — ` : ""}{payment.description}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{formatDate(payment.paidAt)} {payment.paymentMethod ? `· ${payment.paymentMethod}` : ""}</p>
                      </div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "rgba(96,208,96,0.7)" }}>-${payment.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showPayModal && selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: t.modalOverlay, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPayModal(false)}>
          <div style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "40px", maxWidth: "440px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "20px", color: t.text, marginBottom: "8px" }}>Pay {selectedInvoice.invoiceNumber || "Invoice"}</h3>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginBottom: "32px" }}>{selectedInvoice.description}</p>

            <div style={{ padding: "20px", background: t.hoverBg, borderRadius: "10px", marginBottom: "24px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, marginBottom: "4px" }}>Amount Due</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "32px", color: t.text }}>${selectedInvoice.amount.toLocaleString()}.00</p>
            </div>

            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted, textAlign: "center", marginBottom: "16px" }}>
              Contact your team to set up Stripe payments for online payment processing.
            </p>

            <button onClick={() => setShowPayModal(false)} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, background: "none", border: "none", cursor: "pointer", width: "100%", padding: "8px" }}>Close</button>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
