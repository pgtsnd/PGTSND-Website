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
  dueDate: string;
  team: { initials: string; name: string }[];
  tasksTotal: number;
  tasksComplete: number;
  thumbnail: string;
}

const projects: Project[] = [
  {
    id: 1, name: "Spring Campaign Film", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Post-Production", progress: 55, dueDate: "May 15",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }, { initials: "JL", name: "Jamie" }, { initials: "AT", name: "Alex" }, { initials: "KM", name: "Kandice" }],
    tasksTotal: 29, tasksComplete: 14,
    thumbnail: "linear-gradient(135deg, #222 0%, #333 50%, #2a2a2a 100%)",
  },
  {
    id: 2, name: "Product Launch Teaser", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Production", progress: 30, dueDate: "Jun 2",
    team: [{ initials: "BD", name: "Bri" }, { initials: "SR", name: "Sam" }, { initials: "JL", name: "Jamie" }],
    tasksTotal: 22, tasksComplete: 7,
    thumbnail: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #252525 100%)",
  },
  {
    id: 3, name: "Brand Story — Founders Cut", client: "Marcus Tran", clientCompany: "Tran Architecture",
    status: "paused", phase: "Pre-Production", progress: 15, dueDate: "TBD",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }],
    tasksTotal: 18, tasksComplete: 3,
    thumbnail: "linear-gradient(135deg, #2d2d2d 0%, #383838 50%, #2a2a2a 100%)",
  },
  {
    id: 4, name: "Annual Report Video", client: "Sarah Chen", clientCompany: "Pacific NW Health",
    status: "completed", phase: "Delivered", progress: 100, dueDate: "Jan 20",
    team: [{ initials: "BD", name: "Bri" }, { initials: "JL", name: "Jamie" }, { initials: "AT", name: "Alex" }],
    tasksTotal: 24, tasksComplete: 24,
    thumbnail: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1e1e1e 100%)",
  },
  {
    id: 5, name: "Investor Deck Video", client: "Sarah Chen", clientCompany: "Pacific NW Health",
    status: "completed", phase: "Delivered", progress: 100, dueDate: "Feb 1",
    team: [{ initials: "BD", name: "Bri" }, { initials: "SR", name: "Sam" }],
    tasksTotal: 16, tasksComplete: 16,
    thumbnail: "linear-gradient(135deg, #1a1a1a 0%, #252525 50%, #1e1e1e 100%)",
  },
  {
    id: 6, name: "Social Media Package", client: "Lena Park", clientCompany: "Cascade Coffee Co.",
    status: "archived", phase: "Delivered", progress: 100, dueDate: "Sep 15, 2024",
    team: [{ initials: "BD", name: "Bri" }, { initials: "MC", name: "Marcus" }],
    tasksTotal: 12, tasksComplete: 12,
    thumbnail: "linear-gradient(135deg, #1a1a1a 0%, #222 50%, #1e1e1e 100%)",
  },
];

export default function TeamProjects() {
  const { t } = useTheme();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed" | "archived">("all");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const filtered = projects.filter((p) => filter === "all" || p.status === filter);

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
          ]).map((tab) => {
            const count = tab.key === "all" ? projects.length : projects.filter((p) => p.status === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={f({
                fontWeight: filter === tab.key ? 600 : 400, fontSize: "12px",
                color: filter === tab.key ? t.text : t.textMuted,
                background: filter === tab.key ? t.activeNav : "transparent",
                border: `1px solid ${filter === tab.key ? t.border : "transparent"}`,
                borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
              })}>
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {filtered.map((project) => {
            const isInactive = project.status === "archived" || project.status === "completed";
            return (
              <Link key={project.id} href={`/team/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                  overflow: "hidden", cursor: "pointer", opacity: project.status === "archived" ? 0.5 : 1,
                }}>
                  <div style={{
                    height: "100px", background: project.thumbnail,
                    position: "relative", display: "flex", alignItems: "flex-end",
                    padding: "12px 16px",
                  }}>
                    <div style={{
                      position: "absolute", top: "10px", right: "10px",
                      display: "flex", gap: "6px",
                    }}>
                      {project.status === "paused" && (
                        <span style={f({ fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,200,60,0.9)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "4px" })}>Paused</span>
                      )}
                      <span style={f({ fontWeight: 500, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "4px" })}>{project.phase}</span>
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
                        {project.clientCompany} · {project.client}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "-2px" }}>
                        {project.team.slice(0, 3).map((m, i) => (
                          <div key={m.initials} title={m.name} style={{
                            width: "24px", height: "24px", borderRadius: "50%", background: t.activeNav,
                            border: `2px solid ${t.bgCard}`, display: "flex", alignItems: "center", justifyContent: "center",
                            ...f({ fontWeight: 700, fontSize: "8px", color: t.textTertiary }),
                            marginLeft: i > 0 ? "-6px" : "0", position: "relative", zIndex: 3 - i,
                          }}>{m.initials}</div>
                        ))}
                        {project.team.length > 3 && <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, marginLeft: "4px" })}>+{project.team.length - 3}</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1, height: "4px", background: t.border, borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${project.progress}%`, background: isInactive ? t.textMuted : t.accent, borderRadius: "2px" }} />
                      </div>
                      <span style={f({ fontWeight: 700, fontSize: "12px", color: isInactive ? t.textMuted : t.text })}>{project.progress}%</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{project.tasksComplete}/{project.tasksTotal} tasks</span>
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>Due {project.dueDate}</span>
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
