import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Project, type TeamMember } from "../lib/api";

export default function ClientProjects() {
  const { t } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientDashboard()
      .then((data) => {
        const activeProjects = data.projects.filter((p) =>
          ["active", "in_progress", "review", "lead"].includes(p.status),
        );
        setProjects(activeProjects);
        if (activeProjects.length > 0) {
          setSelectedProject(activeProjects[0]);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    api.getProjectTeam(selectedProject.id).then(setTeam).catch(() => setTeam([]));
  }, [selectedProject?.id]);

  const phaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      pre_production: "Pre-Production",
      production: "Production",
      post_production: "Post-Production",
      review: "Review",
      delivered: "Delivered",
    };
    return labels[phase] || phase;
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

  if (projects.length === 0) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "16px" }}>Projects</h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textMuted }}>No projects yet</p>
        </div>
      </ClientLayout>
    );
  }

  const overallProgress = selectedProject?.calculatedProgress ?? 0;

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "32px" }}>Projects</h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: selectedProject?.id === p.id ? 600 : 400,
                fontSize: "13px",
                color: selectedProject?.id === p.id ? t.text : t.textTertiary,
                background: selectedProject?.id === p.id ? t.activeNav : "transparent",
                border: `1px solid ${selectedProject?.id === p.id ? t.border : t.borderSubtle}`,
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {selectedProject && (
          <>
            <div style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>
                  Progress
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>
                    {phaseLabel(selectedProject.phase)}
                  </span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>
                    {overallProgress}% complete
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                {[
                  { label: "Total Tasks", value: selectedProject.totalTasks },
                  { label: "Complete", value: selectedProject.doneTasks },
                  { label: "In Progress", value: selectedProject.inProgressTasks },
                  { label: "Upcoming", value: selectedProject.totalTasks - selectedProject.doneTasks - selectedProject.inProgressTasks },
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", flex: 1, textAlign: "center" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "2px" }}>{stat.value}</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden", marginBottom: "24px" }}>
                <div style={{ height: "100%", width: `${overallProgress}%`, background: t.accent, borderRadius: "3px", transition: "width 0.3s ease" }} />
              </div>

              {selectedProject.description && (
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px 24px", marginBottom: "24px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textSecondary, lineHeight: 1.7 }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {selectedProject.dueDate && (
                  <div style={{ padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Due Date</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text }}>
                      {new Date(selectedProject.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                )}
                {selectedProject.budget && (
                  <div style={{ padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Budget</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text }}>
                      ${selectedProject.budget.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {team.length > 0 && (
              <div>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>
                  Your Team
                </h2>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {team.map((member) => (
                    <div
                      key={member.userId}
                      style={{
                        padding: "16px 20px",
                        background: t.bgCard,
                        border: `1px solid ${t.border}`,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: "200px",
                      }}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: t.activeNav,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        fontSize: "11px",
                        color: t.textTertiary,
                      }}>
                        {member.initials || "??"}
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{member.name}</p>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
