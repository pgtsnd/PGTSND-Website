import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Contract } from "../lib/api";

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientBilling() {
  const { t } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientContracts()
      .then(setContracts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const signedContracts = contracts.filter((c) => c.status === "signed" && c.amount);
  const pendingContracts = contracts.filter((c) => (c.status === "sent" || c.status === "draft") && c.amount);
  const totalPaid = signedContracts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalDue = pendingContracts.reduce((sum, c) => sum + (c.amount || 0), 0);

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
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Total Contracts</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "24px", color: t.text }}>{contracts.filter((c) => c.amount).length}</p>
          </div>
        </div>

        {totalDue > 0 && (
          <div style={{ background: "rgba(255,200,60,0.03)", border: "1px solid rgba(255,200,60,0.1)", borderRadius: "10px", padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>
              You have ${totalDue.toLocaleString()} outstanding across {pendingContracts.length} contract{pendingContracts.length > 1 ? "s" : ""}
            </span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, marginLeft: "8px" }}>
              Stripe billing integration coming soon
            </span>
          </div>
        )}

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Contract Summary</h2>
          <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 120px 100px", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.hoverBg }}>
              {["Contract", "Project", "Amount", "Status"].map((h) => (
                <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted }}>{h}</p>
              ))}
            </div>
            {contracts.filter((c) => c.amount).map((contract) => {
              const isPending = contract.status === "sent" || contract.status === "draft";
              return (
                <div key={contract.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 120px 100px", padding: "16px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" }}>{contract.title}</p>
                    {contract.signedAt && (
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>Signed {formatDate(contract.signedAt)}</p>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{contract.projectName}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text }}>${(contract.amount || 0).toLocaleString()}</p>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: isPending ? "rgba(255,200,60,0.8)" : "rgba(96,208,96,0.8)", background: isPending ? "rgba(255,200,60,0.08)" : "rgba(96,208,96,0.08)", padding: "4px 12px", borderRadius: "4px", textAlign: "center", display: "inline-block" }}>
                    {contract.status === "signed" ? "Paid" : "Due"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "8px" }}>Payment Methods</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, lineHeight: 1.6 }}>
            Stripe integration will be available soon. Payment methods, recurring billing, and invoice management will be configured here.
          </p>
        </div>
      </div>
    </ClientLayout>
  );
}
