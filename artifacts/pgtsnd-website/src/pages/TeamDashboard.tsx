import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

const needsAttention = [
  { id: 1, type: "review" as const, title: "Rough Cut v2 awaiting client review", project: "Spring Campaign Film", waiting: "2 hours", urgency: "now" as const },
  { id: 2, type: "contract" as const, title: "SOW unsigned — blocking production start", project: "Product Launch Teaser", waiting: "3 days", urgency: "urgent" as const },
  { id: 3, type: "contract" as const, title: "Amendment unsigned — extended deliverables", project: "Spring Campaign Film", waiting: "3 days", urgency: "soon" as const },
];

const projects = [
  { id: 1, name: "Spring Campaign Film", client: "Net Your Problem", phase: "Post-Production", progress: 55, dueDate: "May 15", daysLeft: 30, tasksComplete: 14, tasksTotal: 29, color: "#fff" },
  { id: 2, name: "Product Launch Teaser", client: "Net Your Problem", phase: "Production", progress: 30, dueDate: "Jun 2", daysLeft: 48, tasksComplete: 7, tasksTotal: 22, color: "#fff" },
  { id: 3, name: "Brand Story — Founders Cut", client: "Tran Architecture", phase: "Pre-Production", progress: 15, dueDate: "TBD", daysLeft: null, tasksComplete: 3, tasksTotal: 18, color: "#888", paused: true },
];

const pipeline = [
  { phase: "Pre-Production", count: 1 },
  { phase: "Production", count: 1 },
  { phase: "Post-Production", count: 1 },
  { phase: "Review", count: 0 },
  { phase: "Delivered", count: 2 },
];

const teamMembers = [
  { name: "Marcus Cole", role: "DP", initials: "MC", status: "shooting" as const, project: "Product Launch Teaser" },
  { name: "Jamie Lin", role: "Editor", initials: "JL", status: "editing" as const, project: "Spring Campaign Film" },
  { name: "Alex Torres", role: "Colorist", initials: "AT", status: "coloring" as const, project: "Spring Campaign Film" },
  { name: "Sam Reeves", role: "DP", initials: "SR", status: "standby" as const, project: "" },
  { name: "Kandice M.", role: "PM", initials: "KM", status: "admin" as const, project: "Product Launch Teaser" },
];

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
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted, marginBottom: "4px" })}>Welcome back,</p>
          <h1 style={f({ fontWeight: 800, fontSize: "28px", color: t.text, marginBottom: "4px" })}>Bri</h1>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Here's what needs your attention today.</p>
        </div>

        {needsAttention.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
              Needs Attention
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {needsAttention.map((item) => {
                const urgencyColor = item.urgency === "now" ? "#ff6b6b" : item.urgency === "urgent" ? "rgba(255,200,60,0.9)" : t.textMuted;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", padding: "16px 20px",
                    background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                    borderLeft: `3px solid ${urgencyColor}`, cursor: "pointer",
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "3px" })}>{item.title}</p>
                      <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{item.project} · waiting {item.waiting}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {item.type === "review" && (
                        <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>
                          Nudge Client
                        </button>
                      )}
                      {item.type === "contract" && (
                        <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>
                          Resend
                        </button>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          {projects.map((p) => (
            <Link key={p.id} href={`/team/projects/${p.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                padding: "24px", cursor: "pointer", opacity: p.paused ? 0.5 : 1,
                position: "relative", overflow: "hidden",
              }}>
                {p.paused && (
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
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" })}>{p.tasksComplete}/{p.tasksTotal} tasks</p>
                  </div>
                </div>
                <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "4px" })}>{p.name}</p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "14px" })}>{p.client}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "4px 10px", borderRadius: "4px" })}>{p.phase}</span>
                  {p.daysLeft !== null && (
                    <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{p.daysLeft}d left</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
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
              {teamMembers.map((member, i) => {
                const statusMap: Record<string, { label: string; color: string }> = {
                  shooting: { label: "On Set", color: "#fff" },
                  editing: { label: "Editing", color: "#aaa" },
                  coloring: { label: "Grading", color: "#aaa" },
                  standby: { label: "Available", color: t.textMuted },
                  admin: { label: "Admin", color: "#aaa" },
                };
                const s = statusMap[member.status] || { label: "—", color: t.textMuted };
                return (
                  <div key={member.name} style={{
                    display: "flex", alignItems: "center", padding: "12px 20px",
                    borderBottom: i < teamMembers.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                  }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", background: t.activeNav,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      ...f({ fontWeight: 700, fontSize: "10px", color: t.textTertiary }),
                      marginRight: "12px",
                    }}>{member.initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{member.name}</p>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{member.role}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={f({ fontWeight: 500, fontSize: "11px", color: s.color })}>{s.label}</p>
                      {member.project && <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{member.project}</p>}
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
              { label: "This Month", value: "$12,400", sub: "2 invoices paid" },
              { label: "Outstanding", value: "$8,200", sub: "3 pending invoices" },
              { label: "Q2 Pipeline", value: "$34,500", sub: "Across 4 projects" },
              { label: "YTD Revenue", value: "$67,800", sub: "vs $52k last year" },
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
