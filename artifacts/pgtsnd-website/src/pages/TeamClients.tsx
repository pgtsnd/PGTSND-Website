import { useState } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

const clients = [
  {
    id: 1, name: "Nicole Baker", company: "Net Your Problem", role: "Founder & CEO",
    email: "nicole@netyourproblem.com", phone: "(503) 555-0142",
    projects: 2, activeProjects: 2, totalRevenue: "$24,600", status: "active" as const,
    avatar: "NB", lastActivity: "2 hours ago",
    projectList: [
      { id: 1, name: "Spring Campaign Film", status: "active" },
      { id: 2, name: "Product Launch Teaser", status: "active" },
    ],
  },
  {
    id: 2, name: "Marcus Tran", company: "Tran Architecture", role: "Principal Architect",
    email: "marcus@tranarch.com", phone: "(503) 555-0198",
    projects: 1, activeProjects: 0, totalRevenue: "$8,200", status: "paused" as const,
    avatar: "MT", lastActivity: "2 weeks ago",
    projectList: [
      { id: 3, name: "Brand Story — Founders Cut", status: "paused" },
    ],
  },
  {
    id: 3, name: "Sarah Chen", company: "Pacific Northwest Health", role: "VP Marketing",
    email: "schen@pnwhealth.org", phone: "(206) 555-0331",
    projects: 2, activeProjects: 0, totalRevenue: "$42,000", status: "completed" as const,
    avatar: "SC", lastActivity: "Feb 8",
    projectList: [
      { id: 4, name: "Annual Report Video", status: "completed" },
      { id: 5, name: "Investor Deck Video", status: "completed" },
    ],
  },
  {
    id: 4, name: "Lena Park", company: "Cascade Coffee Co.", role: "Marketing Director",
    email: "lena@cascadecoffee.com", phone: "(503) 555-0277",
    projects: 1, activeProjects: 0, totalRevenue: "$6,800", status: "completed" as const,
    avatar: "LP", lastActivity: "Sep 18, 2024",
    projectList: [
      { id: 6, name: "Social Media Package", status: "archived" },
    ],
  },
];

export default function TeamClients() {
  const { t } = useTheme();
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Clients</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{clients.length} clients · ${(24600 + 8200 + 42000 + 6800).toLocaleString()} total revenue</p>
          </div>
          <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Client
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {clients.map((client) => (
            <div key={client.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%", background: t.activeNav,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...f({ fontWeight: 700, fontSize: "14px", color: t.textTertiary }),
                    flexShrink: 0,
                  }}>{client.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "2px" })}>{client.name}</p>
                    <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textTertiary, marginBottom: "2px" })}>{client.company}</p>
                    <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{client.role}</p>
                  </div>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: client.status === "active" ? t.accent : client.status === "paused" ? "rgba(255,200,60,0.6)" : t.textMuted,
                    marginTop: "6px",
                  }} title={client.status} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.projects}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Projects</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.activeProjects}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Active</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.totalRevenue}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Revenue</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" })}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    Email
                  </button>
                  <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" })}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    Message
                  </button>
                </div>

                <button
                  type="button"
                  aria-expanded={expandedClient === client.id}
                  onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                  style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" })}
                >
                  {expandedClient === client.id ? "Hide" : "View"} projects
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedClient === client.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>

              {expandedClient === client.id && (
                <div style={{ borderTop: `1px solid ${t.border}`, padding: "16px 24px" }}>
                  {client.projectList.map((proj) => (
                    <Link key={proj.id} href={`/team/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
                        <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{proj.name}</p>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </TeamLayout>
  );
}
