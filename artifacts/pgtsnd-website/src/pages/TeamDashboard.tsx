import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatPhase,
  formatDate,
  daysUntil,
  isActiveStatus,
} from "../hooks/useTeamData";

function CircleProgress({ progress, size = 80, stroke = 6 }: { progress: number; size?: number; stroke?: number }) {
  const { t } = useTheme();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.accent} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export default function TeamDashboard() {
  const { t } = useTheme();
  const { currentUser, isLoading: authLoading } = useTeamAuth();
  const { projects, users, isLoading } = useDashboardData();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading dashboard...</p>
        </div>
      </TeamLayout>
    );
  }

  const activeProjects = projects.filter((p) => isActiveStatus(p.status));
  const displayProjects = projects.filter((p) => p.status !== "archived");

  const phases = ["pre_production", "production", "post_production", "review", "delivered"];
  const pipeline = phases.map((phase) => ({
    phase: formatPhase(phase),
    count: projects.filter((p) => p.phase === phase && p.status !== "archived").length,
  }));

  const crewMembers = users.filter((u) => u.role !== "client");

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const activeBudget = activeProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const deliveredBudget = projects
    .filter((p) => p.status === "delivered")
    .reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted, marginBottom: "4px" })}>Welcome back,</p>
          <h1 style={f({ fontWeight: 800, fontSize: "28px", color: t.text, marginBottom: "4px" })}>
            {currentUser?.name?.split(" ")[0] ?? "Team"}
          </h1>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Here's what needs your attention today.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          {displayProjects.slice(0, 6).map((p) => {
            const isPaused = p.status === "lead";
            const days = daysUntil(p.dueDate);
            return (
              <Link key={p.id} href={`/team/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                  padding: "24px", cursor: "pointer", opacity: isPaused ? 0.5 : 1,
                  position: "relative", overflow: "hidden",
                }}>
                  {isPaused && (
                    <div style={f({
                      position: "absolute", top: "12px", right: "12px",
                      fontWeight: 600, fontSize: "9px", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "rgba(255,200,60,0.8)",
                      background: "rgba(255,200,60,0.08)", padding: "3px 10px", borderRadius: "4px",
                    })}>Paused</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                    <CircleProgress progress={p.progress} size={72} stroke={5} />
                    <div>
                      <p style={f({ fontWeight: 800, fontSize: "28px", color: t.text, lineHeight: 1 })}>{p.progress}%</p>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" })}>complete</p>
                    </div>
                  </div>
                  <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "4px" })}>{p.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "14px" })}>{p.organizationName}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "4px 10px", borderRadius: "4px" })}>{formatPhase(p.phase)}</span>
                    {days !== null && days > 0 && (
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{days}d left</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
              Pipeline
            </h2>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "16px" }}>
                {pipeline.map((stage, i) => (
                  <div key={stage.phase} style={{ flex: 1, position: "relative" }}>
                    <div style={{
                      height: "4px",
                      background: stage.count > 0 ? t.accent : t.border,
                      borderRadius: i === 0 ? "2px 0 0 2px" : i === pipeline.length - 1 ? "0 2px 2px 0" : "0",
                    }} />
                    <div style={{
                      position: "absolute", top: "-4px", left: "50%", transform: "translateX(-50%)",
                      width: "12px", height: "12px", borderRadius: "50%",
                      background: stage.count > 0 ? t.accent : t.border,
                      border: `2px solid ${t.bgCard}`,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex" }}>
                {pipeline.map((stage) => (
                  <div key={stage.phase} style={{ flex: 1, textAlign: "center" }}>
                    <p style={f({ fontWeight: 700, fontSize: "18px", color: stage.count > 0 ? t.text : t.textMuted, marginBottom: "2px" })}>{stage.count}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" })}>{stage.phase}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
              Crew Status
            </h2>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              {crewMembers.map((member, i) => {
                return (
                  <div key={member.id} style={{
                    display: "flex", alignItems: "center", padding: "12px 20px",
                    borderBottom: i < crewMembers.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                  }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", background: t.activeNav,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      ...f({ fontWeight: 700, fontSize: "10px", color: t.textTertiary }),
                      marginRight: "12px",
                    }}>{member.initials ?? member.name.split(" ").map(n => n[0]).join("")}</div>
                    <div style={{ flex: 1 }}>
                      <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{member.name}</p>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{member.title ?? member.role}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted })}>
                        {member.role === "owner" ? "Active" : "Team"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
            Revenue Snapshot
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
            {[
              { label: "Active Projects", value: `$${activeBudget.toLocaleString()}`, sub: `${activeProjects.length} projects in progress` },
              { label: "Delivered", value: `$${deliveredBudget.toLocaleString()}`, sub: `${projects.filter(p => p.status === "delivered").length} completed projects` },
              { label: "Pipeline Total", value: `$${totalBudget.toLocaleString()}`, sub: `Across ${projects.length} projects` },
              { label: "Active Count", value: `${activeProjects.length}`, sub: `${projects.length} total projects` },
            ].map((stat) => (
              <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px" }}>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>{stat.label}</p>
                <p style={f({ fontWeight: 800, fontSize: "22px", color: t.text, marginBottom: "4px" })}>{stat.value}</p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}
