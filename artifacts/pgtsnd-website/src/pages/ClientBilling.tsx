import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

const invoices = [
  { id: "INV-1042", description: "Spring Campaign — Production Phase", amount: 4500, status: "Paid", date: "Apr 1, 2025", dueDate: "Apr 15, 2025" },
  { id: "INV-1038", description: "Spring Campaign — Pre-Production", amount: 2000, status: "Paid", date: "Mar 15, 2025", dueDate: "Mar 29, 2025" },
  { id: "INV-1045", description: "Spring Campaign — Post-Production", amount: 3500, status: "Due", date: "Apr 14, 2025", dueDate: "Apr 28, 2025" },
  { id: "INV-1048", description: "Product Launch Teaser — Deposit", amount: 2500, status: "Due", date: "Apr 12, 2025", dueDate: "May 1, 2025" },
];

const subscriptions = [
  { name: "Monthly Retainer — Social Content", amount: 500, frequency: "Monthly", nextDate: "May 1, 2025", status: "Active" },
  { name: "Cloud Storage — Asset Hosting", amount: 100, frequency: "Monthly", nextDate: "May 1, 2025", status: "Active" },
  { name: "Quarterly Brand Review", amount: 750, frequency: "Quarterly", nextDate: "Jul 1, 2025", status: "Active" },
];

const paymentHistory = [
  { date: "Apr 1, 2025", description: "INV-1042 — Production Phase", amount: 4500, method: "Visa •••• 4242" },
  { date: "Mar 15, 2025", description: "INV-1038 — Pre-Production", amount: 2000, method: "Visa •••• 4242" },
  { date: "Mar 1, 2025", description: "Monthly Retainer", amount: 500, method: "ACH Bank Transfer" },
  { date: "Feb 1, 2025", description: "Monthly Retainer + Storage", amount: 600, method: "ACH Bank Transfer" },
];

export default function ClientBilling() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const totalDue = invoices.filter((i) => i.status === "Due").reduce((sum, i) => sum + i.amount, 0);

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: "#ffffff" }}>
            Billing
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export All
            </button>
            {totalDue > 0 && (
              <button
                onClick={() => { setSelectedInvoice(null); setShowPayModal(true); }}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#000000",
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  cursor: "pointer",
                }}
              >
                Pay All Outstanding (${totalDue.toLocaleString()})
              </button>
            )}
          </div>
        </div>

        {totalDue > 0 && (
          <div
            style={{
              background: "rgba(255,200,60,0.03)",
              border: "1px solid rgba(255,200,60,0.1)",
              borderRadius: "10px",
              padding: "20px 24px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>
                You have ${totalDue.toLocaleString()} due across {invoices.filter(i => i.status === "Due").length} invoices
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
            Outstanding Invoices
          </h2>

          <div
            style={{
              background: "rgba(255,255,255,0.015)",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 110px 100px 120px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["Invoice", "Description", "Amount", "Due Date", "Status", ""].map((h) => (
                <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                  {h}
                </p>
              ))}
            </div>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 110px 110px 100px 120px",
                  padding: "16px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  alignItems: "center",
                }}
              >
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>
                  {inv.id}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {inv.description}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>
                  ${inv.amount.toLocaleString()}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                  {inv.dueDate}
                </p>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: inv.status === "Paid" ? "rgba(96,208,96,0.8)" : "rgba(255,200,60,0.8)",
                    background: inv.status === "Paid" ? "rgba(96,208,96,0.08)" : "rgba(255,200,60,0.08)",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    textAlign: "center",
                    display: "inline-block",
                  }}
                >
                  {inv.status}
                </span>
                <div style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  {inv.status === "Due" && (
                    <button
                      onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        color: "#000000",
                        background: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Pay Now
                    </button>
                  )}
                  <button
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.35)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              Subscriptions & Recurring
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {subscriptions.map((sub) => (
                <div
                  key={sub.name}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff", marginBottom: "4px" }}>
                      {sub.name}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                      {sub.frequency} · Next: {sub.nextDate}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "15px", color: "#ffffff" }}>
                      ${sub.amount}
                    </p>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: "rgba(96,208,96,0.7)", textTransform: "uppercase" }}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>
                Payment History
              </h2>
              <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Download CSV
              </button>
            </div>
            <div>
              {paymentHistory.map((payment, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: i < paymentHistory.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "2px" }}>
                      {payment.description}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                      {payment.date} · {payment.method}
                    </p>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "rgba(96,208,96,0.7)" }}>
                    -${payment.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                padding: "16px 20px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>
                Payment Methods
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>VISA</div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ffffff" }}>•••• 4242</span>
                </div>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Default</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>ACH</div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ffffff" }}>Chase •••• 8891</span>
                </div>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Bank Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPayModal(false)}
        >
          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "40px",
              maxWidth: "440px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "20px", color: "#ffffff", marginBottom: "8px" }}>
              {selectedInvoice ? `Pay ${selectedInvoice.id}` : "Pay All Outstanding"}
            </h3>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "32px" }}>
              {selectedInvoice
                ? selectedInvoice.description
                : `${invoices.filter(i => i.status === "Due").length} invoices`}
            </p>

            <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "24px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                Amount Due
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "32px", color: "#ffffff" }}>
                ${(selectedInvoice?.amount || totalDue).toLocaleString()}.00
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>
                Pay With
              </p>
              {[
                { label: "Visa •••• 4242", sub: "Credit Card", selected: true },
                { label: "Chase •••• 8891", sub: "ACH Bank Transfer", selected: false },
              ].map((method) => (
                <div
                  key={method.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: method.selected ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    background: method.selected ? "rgba(255,255,255,0.03)" : "transparent",
                    marginBottom: "8px",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>{method.label}</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{method.sub}</p>
                  </div>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: method.selected ? "5px solid #ffffff" : "2px solid rgba(255,255,255,0.15)" }} />
                </div>
              ))}
            </div>

            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#000000",
                background: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "16px 32px",
                cursor: "pointer",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              Confirm Payment
            </button>
            <button
              onClick={() => setShowPayModal(false)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "100%",
                padding: "8px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
