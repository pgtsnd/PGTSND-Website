import { useState } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface Project {
  id: number;
  name: string;
  client: string;
  clientCompany: string;
  status: "active" | "paused" | "completed" | "archived";
  phase: string;
  progress: number;
  startDate: string;
  dueDate: string;
  team: { initials: string; name: string }[];
  tasksTotal: number;
  tasksComplete: number;
  lastActivity: string;
}

const projects: Project[] = [
  {
    id: 1, name: "Spring Campaign Film", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Post-Production", progress: 55, startDate: "Mar 1", dueDate: "May 15",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }, { initials: "JL", name: "Jamie" }, { initials: "AT", name: "Alex" }, { initials: "KM", name: "Kandice" }],
    tasksTotal: 29, tasksComplete: 14, lastActivity: "12 min ago",
  },
  {
    id: 2, name: "Product Launch Teaser", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Production", progress: 30, startDate: "Apr 1", dueDate: "Jun 2",
    team: [{ initials: "BD", name: "Bri" }, { initials: "SR", name: "Sam" }, { initials: "JL", name: "Jamie" }],
    tasksTotal: 22, tasksComplete: 7, lastActivity: "3 hours ago",
  },
  {
    id: 3, name: "Brand Story — Founders Cut", client: "Marcus Tran", clientCompany: "Tran Architecture",
    status: "paused", phase: "Pre-Production", progress: 15, startDate: "Jan 15", dueDate: "TBD",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }],
    tasksTotal: 18, tasksComplete: 3, lastActivity: "2 weeks ago",
  },
  {
    id: 4, name: "Annual Report Video", client: "Sarah Chen", clientCompany: "Pacific Northwest Health",
    status: "completed", phase: "Delivered", progress: 100, startDate: "Nov 1, 2024", dueDate: "Jan 20",
    team: [{ initials: "BD", name: "Bri" }, { initials: "JL", name: "Jamie" }, { initials: "AT", name: "Alex" }],
    tasksTotal: 24, tasksComplete: 24, lastActivity: "Feb 5",
  },
  {
    id: 5, name: "Investor Deck Video", client: "Sarah Chen", clientCompany: "Pacific Northwest Health",
    status: "completed", phase: "Delivered", progress: 100, startDate: "Dec 10, 2024", dueDate: "Feb 1",
    team: [{ initials: "BD", name: "Bri" }, { initials: "SR", name: "Sam" }],
    tasksTotal: 16, tasksComplete: 16, lastActivity: "Feb 8",
  },
  {
    id: 6, name: "Social Media Package", client: "Lena Park", clientCompany: "Cascade Coffee Co.",
    status: "archived", phase: "Delivered", progress: 100, startDate: "Aug 1, 2024", dueDate: "Sep 15, 2024",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }],
    tasksTotal: 12, tasksComplete: 12, lastActivity: "Sep 18, 2024",
  },
];

export default function TeamProjects() {
  const { t } = useTheme();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed" | "archived">("all");

  const filtered = projects.filter((p) => filter === "all" || p.status === filter);

  const statusStyle = (status: string) => {
    if (status === "active") return { color: t.text, bg: t.activeNav, label: "Active" };
    if (status === "paused") return { color: "rgba(255,200,60,0.8)", bg: "rgba(255,200,60,0.08)", label: "Paused" };
    if (status === "completed") return { color: t.textTertiary, bg: t.hoverBg, label: "Completed" };
    return { color: t.textMuted, bg: t.hoverBg, label: "Archived" };
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Projects</h1>
          <button style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.accentText,
            background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Project
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {([
            { key: "all" as const, label: "All", count: projects.length },
            { key: "active" as const, label: "Active", count: projects.filter((p) => p.status === "active").length },
            { key: "paused" as const, label: "Paused", count: projects.filter((p) => p.status === "paused").length },
            { key: "completed" as const, label: "Completed", count: projects.filter((p) => p.status === "completed").length },
            { key: "archived" as const, label: "Archived", count: projects.filter((p) => p.status === "archived").length },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: filter === tab.key ? 600 : 400, fontSize: "12px",
              color: filter === tab.key ? t.text : t.textTertiary,
              background: filter === tab.key ? t.activeNav : "transparent",
              border: `1px solid ${filter === tab.key ? t.border : t.borderSubtle}`,
              borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
            }}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((project) => {
            const s = statusStyle(project.status);
            return (
              <Link key={project.id} href={`/team/projects/${project.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "24px", cursor: "pointer", opacity: project.status === "archived" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "16px", color: t.text }}>{project.name}</h3>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: s.color, background: s.bg, padding: "3px 10px", borderRadius: "4px" }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>{project.clientCompany}</span>
                        <span style={{ color: t.textMuted }}>·</span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{project.client}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>{project.phase}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: "3px", background: t.border, borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${project.progress}%`, background: t.accent, borderRadius: "2px" }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.textTertiary, minWidth: "36px" }}>{project.progress}%</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", borderLeft: `1px solid ${t.border}`, paddingLeft: "16px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{project.tasksComplete}/{project.tasksTotal} tasks</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "-4px", borderLeft: `1px solid ${t.border}`, paddingLeft: "16px" }}>
                      {project.team.slice(0, 4).map((m, i) => (
                        <div key={m.initials} style={{ width: "26px", height: "26px", borderRadius: "50%", background: t.activeNav, border: `2px solid ${t.bgCard}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "8px", color: t.textTertiary, marginLeft: i > 0 ? "-6px" : "0", position: "relative", zIndex: 4 - i }}>{m.initials}</div>
                      ))}
                      {project.team.length > 4 && <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, marginLeft: "4px" }}>+{project.team.length - 4}</span>}
                    </div>

                    <div style={{ borderLeft: `1px solid ${t.border}`, paddingLeft: "16px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>Due {project.dueDate}</span>
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
