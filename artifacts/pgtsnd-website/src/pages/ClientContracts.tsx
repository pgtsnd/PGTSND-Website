import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Contract } from "../lib/api";

const typeLabels: Record<string, string> = {
  SOW: "SOW",
  Amendment: "Amendment",
  NDA: "NDA",
  MSA: "MSA",
  Release: "Release",
};

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientContracts() {
  const { t } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "signed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientContracts()
      .then(setContracts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contracts.filter((c) => {
    if (filter === "pending") return c.status === "sent" || c.status === "draft";
    if (filter === "signed") return c.status === "signed";
    return true;
  });

  const pendingCount = contracts.filter((c) => c.status === "sent" || c.status === "draft").length;

  const handleSign = async (contract: Contract) => {
    if (contract.docusignSigningUrl) {
      window.open(contract.docusignSigningUrl, "_blank");
      return;
    }

    if (contract.docusignEnvelopeId) {
      try {
        const data = await api.getDocuSignSigningUrl(contract.id);
        if (data.url) {
          window.open(data.url, "_blank");
          return;
        }
      } catch {}
    }

    if (contract.documentUrl) {
      window.open(contract.documentUrl, "_blank");
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
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Contracts</h1>
        </div>

        {pendingCount > 0 && (
          <div style={{ background: "rgba(255,200,60,0.04)", border: "1px solid rgba(255,200,60,0.12)", borderRadius: "10px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,200,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>
                {pendingCount} contract{pendingCount > 1 ? "s" : ""} awaiting your signature
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>
                Sign via DocuSign to keep your projects moving
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {([
            { key: "all" as const, label: "All" },
            { key: "pending" as const, label: `Pending (${pendingCount})` },
            { key: "signed" as const, label: "Signed" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: filter === tab.key ? 600 : 400,
                fontSize: "12px",
                color: filter === tab.key ? t.text : t.textTertiary,
                background: filter === tab.key ? t.activeNav : "transparent",
                border: `1px solid ${filter === tab.key ? t.border : t.borderSubtle}`,
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" }}>No contracts</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Contracts will appear here when your team sends them.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((contract) => {
              const isExpanded = expandedId === contract.id;
              const isPending = contract.status === "sent" || contract.status === "draft";
              return (
                <div
                  key={contract.id}
                  style={{
                    background: t.bgCard,
                    border: `1px solid ${isPending ? "rgba(255,200,60,0.15)" : t.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                    style={{
                      padding: "18px 24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: t.hoverBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text }}>
                          {contract.title}
                        </p>
                        {contract.type && (
                          <span style={{
                            fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px",
                            textTransform: "uppercase", letterSpacing: "0.05em",
                            color: t.textMuted, background: t.hoverBg, padding: "2px 8px", borderRadius: "3px",
                          }}>
                            {typeLabels[contract.type] || contract.type}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{contract.projectName}</span>
                        {contract.sentAt && (
                          <>
                            <span style={{ color: t.textMuted }}>·</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>Sent {formatDate(contract.sentAt)}</span>
                          </>
                        )}
                        {contract.amount && (
                          <>
                            <span style={{ color: t.textMuted }}>·</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary }}>${contract.amount.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      {isPending && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSign(contract); }}
                          style={{
                            fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px",
                            color: t.accentText, background: t.accent,
                            padding: "7px 16px", borderRadius: "6px", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Sign in DocuSign
                        </button>
                      )}
                      <span style={{
                        fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        color: isPending ? "rgba(255,200,60,0.8)" : contract.status === "signed" ? t.textTertiary : t.textMuted,
                        background: isPending ? "rgba(255,200,60,0.08)" : t.hoverBg,
                        padding: "4px 12px", borderRadius: "4px",
                      }}>
                        {contract.status === "signed" ? "Signed" : isPending ? "Awaiting Signature" : contract.status}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${t.border}` }}>
                      <div style={{ paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Project</span>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{contract.projectName}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Sent</span>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{formatDate(contract.sentAt)}</span>
                        </div>
                        {contract.signedAt && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Signed</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{formatDate(contract.signedAt)}</span>
                          </div>
                        )}
                        {contract.type && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Type</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{typeLabels[contract.type] || contract.type}</span>
                          </div>
                        )}
                        {contract.amount !== null && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Amount</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>${contract.amount.toLocaleString()}</span>
                          </div>
                        )}
                        {contract.documentUrl && (
                          <div style={{ marginTop: "8px" }}>
                            <a
                              href={contract.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={`${contract.title || "contract"}.pdf`}
                              style={{
                                fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px",
                                color: t.textTertiary, textDecoration: "underline", textUnderlineOffset: "3px",
                                display: "inline-flex", alignItems: "center", gap: "6px",
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                              Download PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
