import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Invoice } from "../lib/api";
import { exportInvoicesToCsv, generateInvoicePdf } from "../lib/exports";
import { ClientBillingSkeleton, ErrorState } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";
import {
  useCreateInvoiceCheckoutSession,
  getInvoicePaymentDetails,
  type PaymentDetails,
} from "@workspace/api-client-react";

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientBilling() {
  const { t } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { toast } = useToast();
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentCanceled, setPaymentCanceled] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, PaymentDetails>>({});
  const createCheckoutMutation = useCreateInvoiceCheckoutSession();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);

      const refetchAfterPayment = (attempts: number) => {
        if (attempts <= 0) return;
        setTimeout(() => {
          api.getClientInvoices().then((data) => {
            setInvoices(data);
            const paidOnes = data.filter((i) => i.status === "paid");
            paidOnes.forEach((inv) => {
              getInvoicePaymentDetails(inv.id).then((details) => {
                setPaymentDetails((prev) => ({ ...prev, [inv.id]: details }));
              }).catch(() => {});
            });
            const stillPending = data.some((i) => i.status === "sent" || i.status === "overdue");
            if (stillPending && attempts > 1) {
              refetchAfterPayment(attempts - 1);
            }
          }).catch(() => {});
        }, 2000);
      };
      refetchAfterPayment(3);
    }
    if (params.get("payment") === "canceled") {
      setPaymentCanceled(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    api
      .getClientInvoices()
      .then((data) => {
        setInvoices(data);
        setError(null);
        const paidOnes = data.filter((i) => i.status === "paid");
        paidOnes.forEach((inv) => {
          getInvoicePaymentDetails(inv.id).then((details) => {
            setPaymentDetails((prev) => ({ ...prev, [inv.id]: details }));
          }).catch(() => {});
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (!paymentSuccess && !paymentCanceled) return;
    const timer = setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentCanceled(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [paymentSuccess, paymentCanceled]);

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

  const handlePayClick = async (invoice: Invoice) => {
    if (checkoutLoading) return;

    setCheckoutLoading(invoice.id);
    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const successUrl = `${baseUrl}?payment=success`;
      const cancelUrl = `${baseUrl}?payment=canceled`;

      const result = await createCheckoutMutation.mutateAsync({
        id: invoice.id,
        data: { successUrl, cancelUrl },
      });
      window.location.href = result.url;
    } catch (err) {
      if (invoice.stripeHostedUrl) {
        toast("Opening hosted checkout in a new tab", "info");
        window.open(invoice.stripeHostedUrl, "_blank");
      } else {
        toast("Couldn't start online checkout. Contact your team for payment options.", "error");
        setSelectedInvoice(invoice);
        setShowPayModal(true);
      }
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <ClientBillingSkeleton />
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState
            message="We couldn't load your billing information. Please check your connection and try again."
            onRetry={refetch}
          />
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
            <button
              onClick={() => {
                const stamp = new Date().toISOString().slice(0, 10);
                exportInvoicesToCsv(invoices, `invoices-${stamp}.csv`);
              }}
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export All
            </button>
          )}
        </div>

        {paymentSuccess && (
          <div style={{ background: "rgba(96,208,96,0.06)", border: "1px solid rgba(96,208,96,0.2)", borderRadius: "10px", padding: "16px 24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(96,208,96,0.9)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(96,208,96,0.9)" }}>Payment successful! Your invoice has been paid.</span>
          </div>
        )}

        {paymentCanceled && (
          <div style={{ background: "rgba(255,200,60,0.03)", border: "1px solid rgba(255,200,60,0.1)", borderRadius: "10px", padding: "16px 24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>Payment was canceled. You can try again anytime.</span>
          </div>
        )}

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
                    const isProcessing = checkoutLoading === inv.id;
                    return (
                      <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 100px 120px", padding: "16px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{inv.invoiceNumber || inv.id.slice(0, 8)}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary }}>{inv.description}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text }}>${inv.amount.toLocaleString()}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{formatDate(inv.dueDate)}</p>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: sc.color, background: sc.bg, padding: "4px 12px", borderRadius: "4px", textAlign: "center", display: "inline-block" }}>{statusLabel(inv.status)}</span>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handlePayClick(inv)}
                            disabled={isProcessing}
                            style={{
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 600,
                              fontSize: "11px",
                              color: t.accentText,
                              background: isProcessing ? t.textMuted : t.accent,
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 16px",
                              cursor: isProcessing ? "wait" : "pointer",
                              opacity: isProcessing ? 0.7 : 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {isProcessing ? (
                              <>
                                <span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid transparent", borderTopColor: t.accentText, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                Processing...
                              </>
                            ) : (
                              "Pay Now"
                            )}
                          </button>
                          {inv.stripePdfUrl ? (
                            <a href={inv.stripePdfUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", display: "flex", alignItems: "center" }}>PDF</a>
                          ) : (
                            <button onClick={() => { void generateInvoicePdf(inv); }} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", display: "flex", alignItems: "center", padding: 0 }}>PDF</button>
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
                  {paidInvoices.map((payment, i) => {
                    const details = paymentDetails[payment.id];
                    const displayMethod = details?.paymentMethod ?? payment.paymentMethod;
                    const displayDate = details?.paidAt ?? payment.paidAt;
                    const displayAmount = details?.amount ?? payment.amount;
                    return (
                      <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < paidInvoices.length - 1 ? `1px solid ${t.borderSubtle}` : "none" }}>
                        <div>
                          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.textSecondary, marginBottom: "2px" }}>{payment.invoiceNumber ? `${payment.invoiceNumber} — ` : ""}{payment.description}</p>
                          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                            {formatDate(displayDate)} {displayMethod ? `· ${displayMethod}` : ""}
                            {details?.status ? ` · ${details.status}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {details?.receiptUrl && (
                            <a href={details.receiptUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, textDecoration: "underline", textUnderlineOffset: "3px" }}>Receipt</a>
                          )}
                          {payment.stripePdfUrl ? (
                            <a href={payment.stripePdfUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, textDecoration: "underline", textUnderlineOffset: "3px" }}>PDF</a>
                          ) : (
                            <button onClick={() => { void generateInvoicePdf(payment); }} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 }}>PDF</button>
                          )}
                          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "rgba(96,208,96,0.7)" }}>-${displayAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
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
              Online payments are not available for this invoice. Please contact your team for payment options.
            </p>

            <button onClick={() => setShowPayModal(false)} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, background: "none", border: "none", cursor: "pointer", width: "100%", padding: "8px" }}>Close</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ClientLayout>
  );
}
