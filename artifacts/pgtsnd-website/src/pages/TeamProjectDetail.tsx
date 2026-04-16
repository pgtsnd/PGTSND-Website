import { useState, useRef, useEffect } from "react";
import { Link, useRoute } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useProjectWithDetails,
  formatPhase,
  formatDateLong,
  type Task,
  type Deliverable,
} from "../hooks/useTeamData";

type Tab = "overview" | "tasks" | "files" | "review";

export default function TeamProjectDetail() {
  const { t } = useTheme();
  const [, params] = useRoute("/team/projects/:id");
  const projectId = params?.id || "";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading: authLoading } = useTeamAuth();

  const { project, members, tasks, deliverables, contracts, isLoading } =
    useProjectWithDetails(projectId);

  useEffect(() => {
    setActiveTab("overview");
  }, [projectId]);

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <Link href="/team/projects" style={f({ fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" })}>← Back to Projects</Link>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted, marginTop: "24px" })}>Loading project...</p>
        </div>
      </TeamLayout>
    );
  }

  if (!project) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <Link href="/team/projects" style={f({ fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" })}>← Back to Projects</Link>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginTop: "24px" })}>Project not found.</p>
        </div>
      </TeamLayout>
    );
  }

  const doneTasks = tasks.filter((t: Task) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t: Task) => t.status === "in_progress").length;
  const pendingDeliverables = deliverables.filter((d: Deliverable) => d.status === "in_review").length;
  const unsignedContracts = contracts.filter((c) => c.status === "sent").length;

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks", badge: `${doneTasks}/${tasks.length}` },
    { key: "files", label: "Deliverables", badge: `${deliverables.length}` },
    { key: "review", label: "Review", badge: pendingDeliverables > 0 ? `${pendingDeliverables}` : undefined },
  ];

  return (
    <TeamLayout>
      <div style={{ padding: "32px 48px", maxWidth: "1200px" }}>
        <Link href="/team/projects" style={f({
          fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px",
        })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Projects
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>{project.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {members.map((m) => (
              <div key={m.userId} title={`${m.name} — ${m.title}`} style={{
                width: "30px", height: "30px", borderRadius: "50%", background: t.activeNav,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...f({ fontWeight: 700, fontSize: "9px", color: t.textTertiary }),
                border: `2px solid ${t.bg}`, marginLeft: "-4px",
              }}>{m.initials}</div>
            ))}
          </div>
        </div>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>
          {formatPhase(project.phase)} · Due {formatDateLong(project.dueDate)}
        </p>

        <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${t.border}`, marginBottom: "28px" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              ...f({
                fontWeight: activeTab === tab.key ? 600 : 400, fontSize: "13px",
                color: activeTab === tab.key ? t.text : t.textMuted,
              }),
              background: "transparent", border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${t.accent}` : "2px solid transparent",
              padding: "12px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              {tab.label}
              {tab.badge && (
                <span style={f({
                  fontWeight: 500, fontSize: "10px",
                  color: tab.key === "review" && pendingDeliverables > 0 ? "rgba(255,200,60,0.9)" : t.textMuted,
                  background: tab.key === "review" && pendingDeliverables > 0 ? "rgba(255,200,60,0.08)" : t.hoverBg,
                  padding: "2px 8px", borderRadius: "10px",
                })}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "32px" }}>
              {[
                { label: "Progress", value: `${project.progress}%` },
                { label: "Phase", value: formatPhase(project.phase) },
                { label: "Tasks Done", value: `${doneTasks}/${tasks.length}` },
                { label: "Budget", value: project.budget ? `$${project.budget.toLocaleString()}` : "—" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "20px",
                }}>
                  <p style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>{stat.value}</p>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>{stat.label}</p>
                </div>
              ))}
            </div>

            <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
              Team
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
              {members.map((m) => (
                <div key={m.userId} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "16px", display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%", background: t.activeNav,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...f({ fontWeight: 700, fontSize: "11px", color: t.textTertiary }),
                  }}>{m.initials}</div>
                  <div>
                    <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{m.name}</p>
                    <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{m.title || m.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {contracts.length > 0 && (
              <>
                <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
                  Contracts
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
                  {contracts.map((c) => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                      borderLeft: c.status === "sent" ? "3px solid rgba(255,200,60,0.8)" : `3px solid ${t.border}`,
                    }}>
                      <div>
                        <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>{c.title}</p>
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                          {c.type} · {c.amount ? `$${c.amount.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      <span style={f({
                        fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em",
                        color: c.status === "signed" ? t.accent : c.status === "sent" ? "rgba(255,200,60,0.9)" : t.textMuted,
                        background: c.status === "signed" ? "rgba(255,255,255,0.06)" : c.status === "sent" ? "rgba(255,200,60,0.08)" : t.hoverBg,
                        padding: "4px 12px", borderRadius: "4px",
                      })}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {project.description && (
              <>
                <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
                  Description
                </h3>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px" }}>
                  <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.6 })}>{project.description}</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Tasks</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                  {doneTasks} of {tasks.length} tasks complete · {inProgressTasks} in progress
                </p>
              </div>
            </div>

            <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ height: "100%", width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%`, background: t.accent, borderRadius: "3px", transition: "width 0.3s" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task: Task) => {
                const statusColors: Record<string, string> = {
                  done: t.accent,
                  in_progress: "rgba(255,200,60,0.8)",
                  todo: t.textMuted,
                  blocked: "#ff6b6b",
                };
                const statusLabels: Record<string, string> = {
                  done: "Done",
                  in_progress: "In Progress",
                  todo: "To Do",
                  blocked: "Blocked",
                };
                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                    opacity: task.status === "done" ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "4px",
                      border: task.status === "done" ? "none" : `1.5px solid ${t.textMuted}`,
                      background: task.status === "done" ? t.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {task.status === "done" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={f({
                        fontWeight: 600, fontSize: "13px", color: t.text,
                        textDecoration: task.status === "done" ? "line-through" : "none",
                      })}>{task.title}</p>
                      {task.description && (
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{task.description}</p>
                      )}
                    </div>
                    <span style={f({
                      fontWeight: 500, fontSize: "10px", textTransform: "uppercase",
                      color: statusColors[task.status] ?? t.textMuted,
                      background: task.status === "done" ? "rgba(255,255,255,0.04)" : t.hoverBg,
                      padding: "4px 10px", borderRadius: "4px",
                    })}>{statusLabels[task.status] ?? task.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Deliverables</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                  {deliverables.length} deliverables for this project
                </p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} />

            {deliverables.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No deliverables yet</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Deliverables will appear here once created.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {deliverables.map((d: Deliverable) => {
                  const statusColors: Record<string, string> = {
                    approved: t.accent,
                    in_review: "rgba(255,200,60,0.8)",
                    draft: t.textMuted,
                    pending: t.textMuted,
                    revision_requested: "#ff6b6b",
                  };
                  return (
                    <div key={d.id} style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5">
                        {d.type === "video" ? <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></> :
                         d.type === "audio" ? <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></> :
                         <><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></>}
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{d.title}</p>
                        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                          {d.type} {d.version ? `· ${d.version}` : ""}
                        </p>
                      </div>
                      <span style={f({
                        fontWeight: 500, fontSize: "10px", textTransform: "uppercase",
                        color: statusColors[d.status] ?? t.textMuted,
                        background: t.hoverBg, padding: "4px 10px", borderRadius: "4px",
                      })}>{d.status.replace("_", " ")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "review" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Client Review</h2>
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Track client feedback on deliverables.</p>
            </div>

            {deliverables.filter((d: Deliverable) => d.status === "in_review" || d.status === "approved" || d.status === "revision_requested").length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No reviews yet</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Send a deliverable for client review.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {deliverables
                  .filter((d: Deliverable) => d.status === "in_review" || d.status === "approved" || d.status === "revision_requested")
                  .map((d: Deliverable) => {
                    const isPending = d.status === "in_review";
                    const isChanges = d.status === "revision_requested";
                    return (
                      <div key={d.id} style={{
                        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                        padding: "24px",
                        borderLeft: isPending ? "3px solid rgba(255,200,60,0.8)" : isChanges ? "3px solid #ff6b6b" : `3px solid ${t.accent}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <div>
                            <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "4px" })}>{d.title}</p>
                            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                              {d.version ?? ""} · {d.type}
                            </p>
                          </div>
                          <span style={f({
                            fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em",
                            color: isPending ? "rgba(255,200,60,0.9)" : isChanges ? "#ff6b6b" : t.accent,
                            background: isPending ? "rgba(255,200,60,0.08)" : isChanges ? "rgba(255,107,107,0.08)" : "rgba(255,255,255,0.06)",
                            padding: "6px 14px", borderRadius: "6px",
                          })}>{isPending ? "Awaiting Review" : isChanges ? "Changes Requested" : "Approved"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {isPending && <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>Nudge Client</button>}
                          <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>View Details</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
