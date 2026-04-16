import { useState } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatStatus,
  type Project,
  type Organization,
  type User,
} from "../hooks/useTeamData";

export default function TeamClients() {
  const { t } = useTheme();
  const { isLoading: authLoading, userMap, allUsers } = useTeamAuth();
  const { projects, organizations, isLoading } = useDashboardData();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading clients...</p>
        </div>
      </TeamLayout>
    );
  }

  const clientUsers = allUsers.filter((u) => u.role === "client");

  const clientData = organizations.map((org: Organization) => {
    const orgProjects = projects.filter((p: Project) => p.organizationId === org.id);
    const clientUser = clientUsers.find((u) => u.id === orgProjects[0]?.clientId);
    const activeCount = orgProjects.filter((p: Project) => p.status === "active" || p.status === "in_progress").length;
    const totalBudget = orgProjects.reduce((sum: number, p: Project) => sum + (p.budget ?? 0), 0);
    const hasActive = activeCount > 0;

    return {
      id: org.id,
      name: org.contactName ?? org.name,
      company: org.name,
      email: org.contactEmail ?? "",
      phone: org.phone ?? "",
      projectCount: orgProjects.length,
      activeProjects: activeCount,
      totalRevenue: totalBudget,
      status: hasActive ? "active" : "completed",
      avatar: (org.contactName ?? org.name).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      projects: orgProjects,
    };
  });

  const totalRevenue = clientData.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Clients</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {clientData.length} clients · ${totalRevenue.toLocaleString()} total revenue
            </p>
          </div>
          <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Client
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {clientData.map((client) => (
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
                    {client.email && <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{client.email}</p>}
                  </div>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: client.status === "active" ? t.accent : t.textMuted,
                    marginTop: "6px",
                  }} title={client.status} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.projectCount}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Projects</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>{client.activeProjects}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Active</p>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: t.text })}>${client.totalRevenue.toLocaleString()}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>Revenue</p>
                  </div>
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
                  {client.projects.map((proj: Project) => (
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
