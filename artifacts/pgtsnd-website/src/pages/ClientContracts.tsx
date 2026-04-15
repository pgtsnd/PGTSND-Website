import { useState } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

interface Contract {
  id: string;
  title: string;
  project: string;
  type: "master" | "sow" | "nda" | "release" | "amendment";
  status: "pending" | "signed" | "expired" | "voided";
  sentDate: string;
  signedDate?: string;
  expiresDate?: string;
  signers: { name: string; role: string; signed: boolean }[];
  docusignUrl?: string;
}

const contracts: Contract[] = [
  {
    id: "CTR-001",
    title: "Master Services Agreement",
    project: "General",
    type: "master",
    status: "signed",
    sentDate: "Feb 15, 2025",
    signedDate: "Feb 18, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: true },
      { name: "Bri Dwyer", role: "PGTSND Productions", signed: true },
    ],
  },
  {
    id: "CTR-002",
    title: "NDA — Confidentiality Agreement",
    project: "General",
    type: "nda",
    status: "signed",
    sentDate: "Feb 15, 2025",
    signedDate: "Feb 16, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: true },
      { name: "Bri Dwyer", role: "PGTSND Productions", signed: true },
    ],
  },
  {
    id: "CTR-003",
    title: "Statement of Work — Spring Campaign Film",
    project: "Spring Campaign Film",
    type: "sow",
    status: "signed",
    sentDate: "Feb 20, 2025",
    signedDate: "Feb 22, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: true },
      { name: "Bri Dwyer", role: "PGTSND Productions", signed: true },
    ],
  },
  {
    id: "CTR-004",
    title: "Location & Talent Release Forms",
    project: "Spring Campaign Film",
    type: "release",
    status: "signed",
    sentDate: "Mar 10, 2025",
    signedDate: "Mar 12, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: true },
      { name: "Harbor Master — Port of Astoria", role: "Location", signed: true },
    ],
  },
  {
    id: "CTR-005",
    title: "Statement of Work — Product Launch Teaser",
    project: "Product Launch Teaser",
    type: "sow",
    status: "pending",
    sentDate: "Apr 8, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: false },
      { name: "Bri Dwyer", role: "PGTSND Productions", signed: true },
    ],
    docusignUrl: "#",
  },
  {
    id: "CTR-006",
    title: "Amendment — Extended Deliverables (9:16 + 1:1 cuts)",
    project: "Spring Campaign Film",
    type: "amendment",
    status: "pending",
    sentDate: "Apr 12, 2025",
    signers: [
      { name: "Nicole Baker", role: "Client", signed: false },
      { name: "Bri Dwyer", role: "PGTSND Productions", signed: true },
    ],
    docusignUrl: "#",
  },
];

const typeLabels: Record<string, string> = {
  master: "MSA",
  sow: "SOW",
  nda: "NDA",
  release: "Release",
  amendment: "Amendment",
};

export default function ClientContracts() {
  const { t } = useTheme();
  const [filter, setFilter] = useState<"all" | "pending" | "signed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = contracts.filter((c) => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "signed") return c.status === "signed";
    return true;
  });

  const pendingCount = contracts.filter((c) => c.status === "pending").length;

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Contracts</h1>
        </div>

        {pendingCount > 0 && (
          <div style={{ background: "rgba(255,200,60,0.04)", border: "1px solid rgba(255,200,60,0.12)", borderRadius: "10px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((contract) => {
            const isExpanded = expandedId === contract.id;
            return (
              <div
                key={contract.id}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${contract.status === "pending" ? "rgba(255,200,60,0.15)" : t.border}`,
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
                      <span style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: t.textMuted,
                        background: t.hoverBg,
                        padding: "2px 8px",
                        borderRadius: "3px",
                      }}>
                        {typeLabels[contract.type]}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{contract.id}</span>
                      <span style={{ color: t.textMuted }}>·</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{contract.project}</span>
                      <span style={{ color: t.textMuted }}>·</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>Sent {contract.sentDate}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {contract.status === "pending" && contract.docusignUrl && (
                      <a
                        href={contract.docusignUrl}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 600,
                          fontSize: "11px",
                          color: t.accentText,
                          background: t.accent,
                          padding: "7px 16px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Sign in DocuSign
                      </a>
                    )}
                    <span style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: contract.status === "pending" ? "rgba(255,200,60,0.8)" : t.textTertiary,
                      background: contract.status === "pending" ? "rgba(255,200,60,0.08)" : t.hoverBg,
                      padding: "4px 12px",
                      borderRadius: "4px",
                    }}>
                      {contract.status === "signed" ? "Signed" : contract.status === "pending" ? "Awaiting Signature" : contract.status}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${t.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", paddingTop: "20px" }}>
                      <div>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: "12px" }}>Signers</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {contract.signers.map((signer, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: t.hoverBg, borderRadius: "6px" }}>
                              <div>
                                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.text }}>{signer.name}</p>
                                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{signer.role}</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {signer.signed ? (
                                  <>
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: t.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary }}>Signed</span>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1.5px solid rgba(255,200,60,0.6)` }} />
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: "rgba(255,200,60,0.7)" }}>Pending</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: "12px" }}>Details</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Sent</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{contract.sentDate}</span>
                          </div>
                          {contract.signedDate && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Signed</span>
                              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{contract.signedDate}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Type</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{typeLabels[contract.type]}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Project</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{contract.project}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                          {contract.status === "signed" && (
                            <button style={{
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 500,
                              fontSize: "11px",
                              color: t.textTertiary,
                              background: t.hoverBg,
                              border: `1px solid ${t.border}`,
                              borderRadius: "6px",
                              padding: "8px 14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download PDF
                            </button>
                          )}
                          <button style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 500,
                            fontSize: "11px",
                            color: t.textTertiary,
                            background: t.hoverBg,
                            border: `1px solid ${t.border}`,
                            borderRadius: "6px",
                            padding: "8px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View in DocuSign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClientLayout>
  );
}
