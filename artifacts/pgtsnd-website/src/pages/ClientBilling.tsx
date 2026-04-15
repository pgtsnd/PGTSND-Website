import ClientLayout from "../components/ClientLayout";

const invoices = [
  { id: "INV-1042", description: "Spring Campaign — Production Phase", amount: "$4,500.00", status: "Paid", date: "Apr 1, 2025" },
  { id: "INV-1038", description: "Spring Campaign — Pre-Production", amount: "$2,000.00", status: "Paid", date: "Mar 15, 2025" },
  { id: "INV-1045", description: "Spring Campaign — Post-Production", amount: "$3,500.00", status: "Pending", date: "Apr 14, 2025" },
  { id: "INV-1048", description: "Product Launch Teaser — Deposit", amount: "$2,500.00", status: "Due May 1", date: "Apr 12, 2025" },
];

const paymentMethods = [
  { type: "Visa", last4: "4242", expiry: "12/26", isDefault: true },
];

export default function ClientBilling() {
  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "28px",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            marginBottom: "40px",
          }}
        >
          Billing
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "48px" }}>
          {[
            { label: "Total Billed", value: "$12,500.00", sub: "All time" },
            { label: "Outstanding", value: "$6,000.00", sub: "2 invoices" },
            { label: "Next Due", value: "May 1, 2025", sub: "INV-1048" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "8px",
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  fontSize: "24px",
                  color: "#ffffff",
                  marginBottom: "4px",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "48px" }}>
          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              Invoices
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 120px 100px 80px",
                padding: "0 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {["Invoice", "Description", "Amount", "Date", "Status"].map((h) => (
                <p
                  key={h}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {h}
                </p>
              ))}
            </div>

            {invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 120px 100px 80px",
                  padding: "16px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>
                  {inv.id}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {inv.description}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>
                  {inv.amount}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                  {inv.date}
                </p>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: inv.status === "Paid" ? "#60d060" : "#f0c040",
                    background: inv.status === "Paid" ? "rgba(96,208,96,0.1)" : "rgba(240,192,64,0.1)",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    textAlign: "center",
                  }}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              Payment Method
            </h2>
            {paymentMethods.map((pm) => (
              <div
                key={pm.last4}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "28px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  VISA
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ffffff" }}>
                    •••• {pm.last4}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                    Expires {pm.expiry}
                  </p>
                </div>
                {pm.isDefault && (
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
            ))}
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                background: "none",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: "8px",
                padding: "14px 20px",
                width: "100%",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              + Add Payment Method
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
