import { useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  type User,
  type Project,
} from "../hooks/useTeamData";

export default function TeamCrew() {
  const { t } = useTheme();
  const { isLoading: authLoading, allUsers } = useTeamAuth();
  const { projects, isLoading } = useDashboardData();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading crew...</p>
        </div>
      </TeamLayout>
    );
  }

  const crewMembers = allUsers.filter((u) => u.role !== "client");

  const activeProjectsByUser = new Map<string, string[]>();
  for (const p of projects) {
    if (p.status === "active" || p.status === "in_progress") {
      if (p.clientId) {
        const existing = activeProjectsByUser.get(p.clientId) ?? [];
        existing.push(p.name);
        activeProjectsByUser.set(p.clientId, existing);
      }
    }
  }

  const crewData = crewMembers.map((user) => {
    const userProjects = activeProjectsByUser.get(user.id) ?? [];
    const isOnProject = userProjects.length > 0 || user.role === "owner";
    return {
      ...user,
      initials: user.initials ?? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      status: isOnProject ? "on-project" as const : "available" as const,
      currentProject: userProjects[0] ?? (user.role === "owner" ? "All Projects" : undefined),
      projectCount: projects.length,
    };
  });

  const available = crewData.filter((c) => c.status === "available").length;
  const onProject = crewData.filter((c) => c.status === "on-project").length;

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Crew</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {crewData.length} members · {available} available · {onProject} on project
            </p>
          </div>
          <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Member
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {crewData.map((member) => (
            <div key={member.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={expandedMember === member.id}
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "20px 24px", cursor: "pointer", width: "100%",
                  background: "transparent", border: "none", textAlign: "left",
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", background: t.activeNav,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...f({ fontWeight: 700, fontSize: "14px", color: t.textTertiary }),
                  flexShrink: 0,
                }}>{member.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "2px" })}>{member.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{member.title ?? member.role}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {member.currentProject && (
                    <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{member.currentProject}</span>
                  )}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "4px",
                    background: member.status === "available" ? "rgba(255,255,255,0.06)" : t.hoverBg,
                  }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: member.status === "available" ? t.accent : t.textMuted,
                    }} />
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, textTransform: "capitalize" })}>
                      {member.status === "on-project" ? "Busy" : "Available"}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: expandedMember === member.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </button>

              {expandedMember === member.id && (
                <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${t.borderSubtle}`, paddingTop: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Email</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.email}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Role</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary, textTransform: "capitalize" })}>{member.role}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Title</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.title ?? "—"}</p>
                    </div>
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "8px" })}>
                    Member since {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </TeamLayout>
  );
}
