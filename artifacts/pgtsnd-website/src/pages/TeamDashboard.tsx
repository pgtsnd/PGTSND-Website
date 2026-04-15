import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

const activeProjects = [
  { id: 1, name: "Spring Campaign Film", client: "Net Your Problem", phase: "Post-Production", progress: 55, dueDate: "May 15", tasksRemaining: 15, urgentTasks: 2 },
  { id: 2, name: "Product Launch Teaser", client: "Net Your Problem", phase: "Production", progress: 30, dueDate: "Jun 2", tasksRemaining: 18, urgentTasks: 0 },
];

const recentActivity = [
  { user: "Jamie Lin", action: "exported Rough Cut v2 to review", project: "Spring Campaign Film", time: "12 min ago" },
  { user: "Marcus Cole", action: "uploaded 47 new clips from Day 3", project: "Spring Campaign Film", time: "1 hour ago" },
  { user: "Nicole Baker", action: "left 3 comments on Rough Cut v1", project: "Spring Campaign Film", time: "2 hours ago" },
  { user: "Sam Reeves", action: "completed lighting test for product macro", project: "Product Launch Teaser", time: "3 hours ago" },
  { user: "Alex Torres", action: "started color grading — Scene 1–3", project: "Spring Campaign Film", time: "Yesterday" },
  { user: "Kandice M.", action: "sent SOW to client for signature", project: "Product Launch Teaser", time: "Yesterday" },
];

const pendingClientActions = [
  { client: "Nicole Baker", company: "Net Your Problem", action: "Review Rough Cut v2", project: "Spring Campaign Film", waitingSince: "2 hours" },
  { client: "Nicole Baker", company: "Net Your Problem", action: "Sign SOW — Product Launch Teaser", project: "Product Launch Teaser", waitingSince: "3 days" },
  { client: "Nicole Baker", company: "Net Your Problem", action: "Sign Amendment — Extended Deliverables", project: "Spring Campaign Film", waitingSince: "3 days" },
];

const teamWorkload = [
  { name: "Bri Dwyer", role: "Director", initials: "BD", activeTasks: 4, projectCount: 2 },
  { name: "Marcus Cole", role: "Cinematographer", initials: "MC", activeTasks: 2, projectCount: 1 },
  { name: "Jamie Lin", role: "Editor", initials: "JL", activeTasks: 6, projectCount: 2 },
  { name: "Alex Torres", role: "Colorist", initials: "AT", activeTasks: 1, projectCount: 1 },
  { name: "Sam Reeves", role: "Cinematographer", initials: "SR", activeTasks: 3, projectCount: 1 },
  { name: "Kandice M.", role: "Project Manager", initials: "KM", activeTasks: 3, projectCount: 2 },
];

export default function TeamDashboard() {
  const { t } = useTheme();

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "36px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginBottom: "4px" }}>Good morning,</p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "28px", color: t.text }}>Bri</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "36px" }}>
          {[
            { label: "Active Projects", value: "2" },
            { label: "Total Active Tasks", value: "19" },
            { label: "Pending Client Actions", value: "3" },
            { label: "Crew Members", value: "6" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px 24px" }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "28px", color: t.text, marginBottom: "4px" }}>{stat.value}</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "36px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>Active Projects</h2>
              <Link href="/team/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" }}>View All →</Link>
            </div>
            {activeProjects.map((project) => (
              <Link key={project.id} href={`/team/projects/${project.id}`} style={{ textDecoration: "none", display: "block", marginBottom: "10px" }}>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px 24px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "4px" }}>{project.name}</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{project.client}</p>
                    </div>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, padding: "4px 10px", borderRadius: "4px" }}>{project.phase}</span>
                  </div>
                  <div style={{ height: "3px", background: t.border, borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", width: `${project.progress}%`, background: t.accent, borderRadius: "2px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{project.tasksRemaining} tasks remaining</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary }}>Due {project.dueDate}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>Waiting on Client</h2>
            </div>
            {pendingClientActions.map((item, i) => (
              <div key={i} style={{ padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{item.action}</p>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: "rgba(255,200,60,0.8)", background: "rgba(255,200,60,0.08)", padding: "3px 10px", borderRadius: "4px", flexShrink: 0, marginLeft: "8px" }}>
                    {item.waitingSince}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{item.client}</span>
                  <span style={{ color: t.textMuted }}>·</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{item.project}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Recent Activity</h2>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
              {recentActivity.map((item, i) => (
                <div key={i} style={{ padding: "14px 20px", borderBottom: i < recentActivity.length - 1 ? `1px solid ${t.borderSubtle}` : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: t.text }}>{item.user}</span> {item.action}
                    </p>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px", display: "inline-block", marginTop: "4px" }}>{item.project}</span>
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, flexShrink: 0, marginLeft: "12px" }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Team Workload</h2>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
              {teamWorkload.map((member, i) => (
                <div key={member.name} style={{ padding: "14px 20px", borderBottom: i < teamWorkload.length - 1 ? `1px solid ${t.borderSubtle}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: t.activeNav, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", color: t.textTertiary }}>{member.initials}</div>
                    <div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{member.name}</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{member.role}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text }}>{member.activeTasks}</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: t.textMuted }}>Tasks</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text }}>{member.projectCount}</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: t.textMuted }}>Projects</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}
