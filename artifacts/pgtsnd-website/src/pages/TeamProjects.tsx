import { useState } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { ProjectsSkeleton, ErrorState } from "../components/TeamLoadingStates";
import {
  useDashboardData,
  formatPhase,
  formatDate,
  daysUntil,
} from "../hooks/useTeamData";

type FilterKey = "all" | "active" | "paused" | "completed" | "archived";

function mapStatusToFilter(status: string): FilterKey {
  if (status === "active" || status === "in_progress") return "active";
  if (status === "lead") return "paused";
  if (status === "delivered" || status === "review") return "completed";
  if (status === "archived") return "archived";
  return "active";
}

export default function TeamProjects() {
  const { t } = useTheme();
  const { isLoading: authLoading } = useTeamAuth();
  const { projects, isLoading, isError, refetch } = useDashboardData();
  const [filter, setFilter] = useState<FilterKey>("all");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <ProjectsSkeleton />
      </TeamLayout>
    );
  }

  if (isError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load your projects. Please check your connection and try again." onRetry={refetch} />
        </div>
      </TeamLayout>
    );
  }

  const filtered = projects.filter((p) => filter === "all" || mapStatusToFilter(p.status) === filter);

  const filterCounts = {
    all: projects.length,
    active: projects.filter((p) => mapStatusToFilter(p.status) === "active").length,
    paused: projects.filter((p) => mapStatusToFilter(p.status) === "paused").length,
    completed: projects.filter((p) => mapStatusToFilter(p.status) === "completed").length,
    archived: projects.filter((p) => mapStatusToFilter(p.status) === "archived").length,
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>Projects</h1>
          <button style={f({
            fontWeight: 600, fontSize: "12px", color: t.accentText,
            background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
          })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Project
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          {([
            { key: "all" as const, label: "All" },
            { key: "active" as const, label: "Active" },
            { key: "paused" as const, label: "Paused" },
            { key: "completed" as const, label: "Completed" },
            { key: "archived" as const, label: "Archived" },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={f({
              fontWeight: filter === tab.key ? 600 : 400, fontSize: "12px",
              color: filter === tab.key ? t.text : t.textMuted,
              background: filter === tab.key ? t.activeNav : "transparent",
              border: `1px solid ${filter === tab.key ? t.border : "transparent"}`,
              borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
            })}>
              {tab.label} ({filterCounts[tab.key]})
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {filtered.map((project) => {
            const isInactive = project.status === "archived" || project.status === "delivered";
            const isPaused = project.status === "lead";
            const days = daysUntil(project.dueDate);
            return (
              <Link key={project.id} href={`/team/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                  overflow: "hidden", cursor: "pointer", opacity: project.status === "archived" ? 0.5 : 1,
                }}>
                  <div style={{
                    height: "100px", background: "linear-gradient(135deg, #222 0%, #333 50%, #2a2a2a 100%)",
                    position: "relative", display: "flex", alignItems: "flex-end",
                    padding: "12px 16px",
                  }}>
                    <div style={{
                      position: "absolute", top: "10px", right: "10px",
                      display: "flex", gap: "6px",
                    }}>
                      {isPaused && (
                        <span style={f({ fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,200,60,0.9)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "4px" })}>Paused</span>
                      )}
                      <span style={f({ fontWeight: 500, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "4px" })}>{formatPhase(project.phase)}</span>
                    </div>
                    <div style={{
                      position: "absolute", bottom: "0", left: "0", right: "0",
                      height: "60px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    }} />
                    <p style={f({ fontWeight: 800, fontSize: "18px", color: "#fff", position: "relative", zIndex: 1 })}>{project.name}</p>
                  </div>

                  <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                        {project.organizationName}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, height: "4px", background: t.border, borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${project.progress}%`, background: isInactive ? t.textMuted : t.accent, borderRadius: "2px" }} />
                      </div>
                      <span style={f({ fontWeight: 700, fontSize: "12px", color: isInactive ? t.textMuted : t.text })}>{project.progress}%</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                        {project.budget ? `$${project.budget.toLocaleString()} budget` : "No budget set"}
                      </span>
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                        Due {formatDate(project.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </TeamLayout>
  );
}
