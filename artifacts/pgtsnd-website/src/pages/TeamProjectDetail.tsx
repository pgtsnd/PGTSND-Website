import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import type { VideoComment } from "../components/VideoReviewPanel";
import { api, type VideoCommentWithReplies, type ReviewLinkData } from "../lib/api";
import {
  useProjectWithDetails,
  formatPhase,
  formatDateLong,
  type Task,
  type Deliverable,
} from "../hooks/useTeamData";
import {
  useListTaskItems,
  useUpdateTaskItem,
  useCreateTask,
  useUpdateProject,
} from "@workspace/api-client-react";

type Tab = "overview" | "milestones" | "deliverables" | "assets" | "review";

export default function TeamProjectDetail() {
  const { t } = useTheme();
  const [, params] = useRoute("/team/projects/:id");
  const projectId = params?.id || "";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { isLoading: authLoading } = useTeamAuth();
  const [showHeaderImageModal, setShowHeaderImageModal] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const updateProject = useUpdateProject();

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

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "milestones", label: "Milestones", badge: `${doneTasks}/${tasks.length}` },
    { key: "deliverables", label: "Deliverables", badge: `${deliverables.length}` },
    { key: "assets", label: "Assets" },
    { key: "review", label: "Review", badge: pendingDeliverables > 0 ? `${pendingDeliverables}` : undefined },
  ];

  const queryClient = useQueryClient();

  const handleSaveHeaderImage = () => {
    if (!headerImageUrl.trim()) return;
    updateProject.mutate(
      { id: projectId, data: { thumbnail: headerImageUrl.trim() } },
      { onSuccess: () => { setShowHeaderImageModal(false); setHeaderImageUrl(""); queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] }); } },
    );
  };

  return (
    <TeamLayout>
      <div style={{ maxWidth: "1200px" }}>
        {project.thumbnail ? (
          <div style={{
            position: "relative", width: "100%", height: "180px",
            backgroundImage: `url(${project.thumbnail})`,
            backgroundSize: "cover", backgroundPosition: "center",
            borderBottom: `1px solid ${t.border}`,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(transparent 40%, rgba(0,0,0,0.7) 100%)",
            }} />
            <button
              onClick={() => { setHeaderImageUrl(project.thumbnail || ""); setShowHeaderImageModal(true); }}
              style={{
                position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "6px 10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                ...f({ fontWeight: 500, fontSize: "10px", color: "white" }),
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Change
            </button>
          </div>
        ) : (
          <div style={{ padding: "32px 48px 0" }}>
            <button
              onClick={() => setShowHeaderImageModal(true)}
              style={{
                width: "100%", height: "100px", borderRadius: "10px",
                border: `2px dashed ${t.border}`, background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px", marginBottom: "20px",
                ...f({ fontWeight: 500, fontSize: "12px", color: t.textMuted }),
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Add header image
            </button>
          </div>
        )}

        {showHeaderImageModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setShowHeaderImageModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
              padding: "28px", width: "440px",
            }}>
              <h3 style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "16px" })}>
                Project Header Image
              </h3>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "12px" })}>
                Paste an image URL for the project header.
              </p>
              <input
                value={headerImageUrl}
                onChange={(e) => setHeaderImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "6px",
                  background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
                  outline: "none", marginBottom: "16px", boxSizing: "border-box",
                  ...f({ fontWeight: 400, fontSize: "13px" }),
                }}
              />
              {headerImageUrl && (
                <div style={{
                  width: "100%", height: "120px", borderRadius: "8px", overflow: "hidden",
                  marginBottom: "16px", border: `1px solid ${t.border}`,
                  backgroundImage: `url(${headerImageUrl})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                }} />
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowHeaderImageModal(false)} style={f({
                  fontWeight: 500, fontSize: "12px", color: t.textMuted,
                  background: "transparent", border: `1px solid ${t.border}`,
                  borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
                })}>Cancel</button>
                <button onClick={handleSaveHeaderImage} disabled={!headerImageUrl.trim() || updateProject.isPending} style={f({
                  fontWeight: 600, fontSize: "12px", color: t.accentText,
                  background: t.accent, border: "none", borderRadius: "6px",
                  padding: "8px 16px", cursor: "pointer",
                  opacity: headerImageUrl.trim() && !updateProject.isPending ? 1 : 0.4,
                })}>{updateProject.isPending ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "32px 48px" }}>
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
          <OverviewTab
            project={project}
            tasks={tasks}
            doneTasks={doneTasks}
            contracts={contracts}
            projectId={projectId}
          />
        )}

        {activeTab === "milestones" && (
          <MilestonesTab
            tasks={tasks}
            doneTasks={doneTasks}
            inProgressTasks={inProgressTasks}
            projectId={projectId}
          />
        )}

        {activeTab === "deliverables" && (
          <DeliverablesTab deliverables={deliverables} />
        )}

        {activeTab === "assets" && (
          <AssetsTab projectId={projectId} projectName={project.name} />
        )}

        {activeTab === "review" && (
          <TeamReviewTab deliverables={deliverables} projectId={projectId} />
        )}
        </div>
      </div>
    </TeamLayout>
  );
}

function OverviewTab({ project, tasks, doneTasks, contracts, projectId }: {
  project: any; tasks: Task[]; doneTasks: number; contracts: any[]; projectId: string;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const creativeLinks = [
    { label: "Treatment", desc: "Creative narrative brief", icon: "doc", path: `/client-hub/projects/${projectId}/treatment` },
    { label: "Storyboard", desc: "Visual scene planning", icon: "grid", path: `/client-hub/projects/${projectId}/storyboard` },
    { label: "Shot List", desc: "Production shot breakdown", icon: "list", path: `/client-hub/projects/${projectId}/shotlist` },
  ];

  return (
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
        Creative Documents
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "32px" }}>
        {creativeLinks.map((link) => (
          <Link key={link.label} href={link.path} style={{ textDecoration: "none" }}>
            <div style={{
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
              padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px", background: t.hoverBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {link.icon === "doc" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                {link.icon === "grid" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>}
                {link.icon === "list" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
              </div>
              <div>
                <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{link.label}</p>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {contracts.length > 0 && (
        <>
          <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
            Contracts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
            {contracts.map((c: any) => (
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
  );
}

function MilestoneRow({ task }: { task: Task }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expanded, setExpanded] = useState(false);
  const { data: items, refetch } = useListTaskItems(task.id, {
    query: { enabled: expanded },
  });
  const updateItem = useUpdateTaskItem();

  const handleToggleItem = (itemId: string, currentCompleted: boolean) => {
    updateItem.mutate(
      { id: itemId, data: { completed: !currentCompleted } },
      { onSuccess: () => refetch() },
    );
  };

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

  const completedItems = items?.filter((i: any) => i.completed).length ?? 0;
  const totalItems = items?.length ?? 0;

  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "grid", gridTemplateColumns: "32px 1fr 120px 100px 100px",
          alignItems: "center", gap: "12px",
          padding: "14px 16px", cursor: "pointer",
          borderBottom: expanded ? `1px solid ${t.border}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {task.status === "done" ? (
            <div style={{
              width: "20px", height: "20px", borderRadius: "4px", background: t.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>

        <div>
          <p style={f({
            fontWeight: 600, fontSize: "13px", color: t.text,
            textDecoration: task.status === "done" ? "line-through" : "none",
            opacity: task.status === "done" ? 0.6 : 1,
          })}>{task.title}</p>
        </div>

        <div>
          <span style={f({
            fontWeight: 500, fontSize: "10px", textTransform: "uppercase",
            color: statusColors[task.status] ?? t.textMuted,
            background: task.status === "done" ? "rgba(255,255,255,0.04)" : t.hoverBg,
            padding: "4px 10px", borderRadius: "4px",
          })}>{statusLabels[task.status] ?? task.status}</span>
        </div>

        <div>
          {task.dueDate && (
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
            <div style={{ width: "40px", height: "3px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${task.progress}%`, height: "100%", background: statusColors[task.status] ?? t.textMuted, borderRadius: "2px" }} />
            </div>
            <span style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted })}>{task.progress}%</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0" }}>
          {task.description && (
            <div style={{ padding: "12px 16px 0 60px" }}>
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, lineHeight: 1.5 })}>{task.description}</p>
            </div>
          )}

          {items && items.length > 0 ? (
            <div style={{ padding: "12px 16px 16px 60px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>
                  Sub-tasks
                </p>
                <span style={f({ fontWeight: 500, fontSize: "9px", color: t.textMuted })}>
                  {completedItems}/{totalItems}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={(e) => { e.stopPropagation(); handleToggleItem(item.id, item.completed); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "8px 12px", borderRadius: "6px", cursor: "pointer",
                      background: item.completed ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${t.borderSubtle}`,
                    }}
                  >
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0,
                      border: item.completed ? "none" : `1.5px solid ${t.textMuted}`,
                      background: item.completed ? t.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s",
                    }}>
                      {item.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <span style={f({
                      fontWeight: 400, fontSize: "12px",
                      color: item.completed ? t.textMuted : t.textSecondary,
                      textDecoration: item.completed ? "line-through" : "none",
                    })}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : items && items.length === 0 ? (
            <div style={{ padding: "12px 16px 16px 60px" }}>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>No sub-tasks for this milestone.</p>
            </div>
          ) : (
            <div style={{ padding: "12px 16px 16px 60px" }}>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>Loading...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MilestonesTab({ tasks, doneTasks, inProgressTasks, projectId }: {
  tasks: Task[]; doneTasks: number; inProgressTasks: number; projectId: string;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const createTask = useCreateTask();
  const queryClient = useQueryClient();

  const handleAddMilestone = () => {
    if (!newTitle.trim()) return;
    createTask.mutate(
      { projectId, data: { title: newTitle.trim(), description: newDescription.trim() || undefined, status: "todo", progress: 0, sortOrder: tasks.length + 1 } },
      { onSuccess: () => { setShowAddModal(false); setNewTitle(""); setNewDescription(""); queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] }); } },
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Milestones</h2>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
            {doneTasks} of {tasks.length} complete · {inProgressTasks} in progress
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={f({
            fontWeight: 600, fontSize: "11px", color: t.accentText,
            background: t.accent, border: "none", borderRadius: "6px",
            padding: "8px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          })}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Milestone
        </button>
      </div>

      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowAddModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
            padding: "28px", width: "480px",
          }}>
            <h3 style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "16px" })}>
              Add Milestone
            </h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Treatment, Storyboard, Rough Cut, Color Grade..."
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "6px",
                  background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
                  outline: "none", boxSizing: "border-box",
                  ...f({ fontWeight: 400, fontSize: "13px" }),
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" })}>Description (optional)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What needs to happen for this milestone..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "6px",
                  background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
                  outline: "none", resize: "vertical", boxSizing: "border-box",
                  ...f({ fontWeight: 400, fontSize: "13px" }),
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddModal(false)} style={f({
                fontWeight: 500, fontSize: "12px", color: t.textMuted,
                background: "transparent", border: `1px solid ${t.border}`,
                borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
              })}>Cancel</button>
              <button onClick={handleAddMilestone} disabled={!newTitle.trim() || createTask.isPending} style={f({
                fontWeight: 600, fontSize: "12px", color: t.accentText,
                background: t.accent, border: "none", borderRadius: "6px",
                padding: "8px 16px", cursor: "pointer",
                opacity: newTitle.trim() && !createTask.isPending ? 1 : 0.4,
              })}>
                {createTask.isPending ? "Adding..." : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ height: "100%", width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%`, background: t.accent, borderRadius: "3px", transition: "width 0.3s" }} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "32px 1fr 120px 100px 100px",
        gap: "12px", padding: "8px 16px", marginBottom: "4px",
      }}>
        <div />
        <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>Milestone</p>
        <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>Status</p>
        <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>Due</p>
        <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" })}>Progress</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {tasks.map((task: Task) => (
          <MilestoneRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function DeliverablesTab({ deliverables }: { deliverables: Deliverable[] }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    approved: t.accent,
    in_review: "rgba(255,200,60,0.8)",
    draft: t.textMuted,
    pending: t.textMuted,
    revision_requested: "#ff6b6b",
  };
  const statusLabels: Record<string, string> = {
    draft: "Draft",
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    revision_requested: "Changes Requested",
  };

  const typeIcons: Record<string, JSX.Element> = {
    video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
    audio: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
    graphics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    document: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
    other: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Deliverables</h2>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
          {deliverables.length} deliverables for this project
        </p>
      </div>

      {deliverables.length === 0 ? (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No deliverables yet</p>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Deliverables will appear here once created.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {deliverables.map((d: Deliverable) => {
            const isExpanded = expandedId === d.id;
            return (
              <div key={d.id} style={{
                background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                overflow: "hidden",
              }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "16px 20px", cursor: "pointer",
                  }}
                >
                  <div style={{ color: t.textMuted, flexShrink: 0 }}>
                    {typeIcons[d.type] ?? typeIcons.other}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>{d.title}</p>
                    <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                      {d.type} {d.version ? `· ${d.version}` : ""}
                    </p>
                  </div>
                  <span style={f({
                    fontWeight: 500, fontSize: "10px", textTransform: "uppercase",
                    color: statusColors[d.status] ?? t.textMuted,
                    background: t.hoverBg, padding: "4px 10px", borderRadius: "4px",
                  })}>{statusLabels[d.status] ?? d.status}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isExpanded && (
                  <div style={{
                    padding: "0 20px 20px 52px",
                    borderTop: `1px solid ${t.borderSubtle}`,
                  }}>
                    <div style={{ paddingTop: "16px" }}>
                      {d.description ? (
                        <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.6, marginBottom: "16px" })}>
                          {d.description}
                        </p>
                      ) : (
                        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "16px" })}>
                          No description provided.
                        </p>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                          <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Type</p>
                          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text, textTransform: "capitalize" })}>{d.type}</p>
                        </div>
                        <div>
                          <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Version</p>
                          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text })}>{d.version || "v1"}</p>
                        </div>
                        <div>
                          <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Submitted</p>
                          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text })}>
                            {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not yet"}
                          </p>
                        </div>
                      </div>

                      {d.fileUrl && (
                        <div style={{ marginTop: "16px" }}>
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={f({
                            fontWeight: 600, fontSize: "11px", color: t.accent, textDecoration: "none",
                            display: "inline-flex", alignItems: "center", gap: "6px",
                          })}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Open file
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetsTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const folders = [
    { name: "Source Footage", icon: "film", count: 0 },
    { name: "Exports", icon: "package", count: 0 },
    { name: "Graphics & Stills", icon: "image", count: 0 },
    { name: "Audio", icon: "music", count: 0 },
    { name: "Documents", icon: "file", count: 0 },
    { name: "Client Uploads", icon: "upload", count: 0 },
  ];

  const folderIcons: Record<string, JSX.Element> = {
    film: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" /></svg>,
    package: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    image: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    music: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
    file: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
    upload: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Assets</h2>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
            Project files and shared assets
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={f({
            fontWeight: 600, fontSize: "11px", color: t.accentText,
            background: t.accent, border: "none", borderRadius: "6px",
            padding: "8px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          })}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload Files
        </button>
        <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        style={{
          border: `2px dashed ${dragOver ? t.accent : t.border}`,
          borderRadius: "12px", padding: "32px", textAlign: "center",
          marginBottom: "24px", transition: "border-color 0.2s",
          background: dragOver ? "rgba(255,255,255,0.02)" : "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ marginBottom: "8px" }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "4px" })}>
          Drag & drop files here
        </p>
        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
          or click Upload Files above
        </p>
      </div>

      <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
        Project Folders
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "32px" }}>
        {folders.map((folder) => (
          <div key={folder.name} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
            padding: "20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px",
          }}>
            {folderIcons[folder.icon]}
            <div>
              <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{folder.name}</p>
              <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>
                {folder.count} files
              </p>
            </div>
          </div>
        ))}
      </div>

      <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
        Recent Files
      </h3>
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
        padding: "40px", textAlign: "center",
      }}>
        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "4px" })}>No files uploaded yet</p>
        <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
          Upload files to share with the team. Files will be organized into project folders automatically.
        </p>
      </div>
    </div>
  );
}

function TeamReviewTab({ deliverables, projectId }: { deliverables: Deliverable[]; projectId: string }) {
  const { t } = useTheme();
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [comments, setComments] = useState<VideoCommentWithReplies[]>([]);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [reviewLinks, setReviewLinks] = useState<ReviewLinkData[]>([]);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const ff = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const reviewableDeliverables = deliverables.filter(
    (d: Deliverable) => d.type === "video" || d.status === "in_review" || d.status === "approved" || d.status === "revision_requested",
  );

  useEffect(() => {
    if (reviewableDeliverables.length > 0 && !selectedDeliverable) {
      setSelectedDeliverable(reviewableDeliverables[0]);
    }
  }, [reviewableDeliverables.length]);

  useEffect(() => {
    if (!selectedDeliverable) return;
    api.getVideoComments(selectedDeliverable.id).then(setComments).catch(() => setComments([]));
    api.getReviewLinks(selectedDeliverable.id).then(setReviewLinks).catch(() => setReviewLinks([]));
  }, [selectedDeliverable?.id]);

  const handleAddComment = useCallback(
    async (timestampSeconds: number, content: string) => {
      if (!selectedDeliverable) return;
      const comment = await api.addVideoComment(selectedDeliverable.id, timestampSeconds, content);
      setComments((prev) => [...prev, comment].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
      setActiveTimestamp(null);
    },
    [selectedDeliverable],
  );

  const handleAddReply = useCallback(
    async (commentId: string, content: string) => {
      const reply = await api.addVideoCommentReply(commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c)),
      );
    },
    [],
  );

  const handleCommentClick = useCallback((comment: VideoComment) => {
    setSeekTo(comment.timestampSeconds);
    setTimeout(() => setSeekTo(null), 100);
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      const comment = comments.find((c) => c.id === id);
      if (comment) handleCommentClick(comment);
    },
    [comments, handleCommentClick],
  );

  const handlePushForReview = async () => {
    if (!selectedDeliverable) return;
    setSubmittingAction(true);
    try {
      await api.submitForReview(selectedDeliverable.id);
      setActionMsg("Pushed for client review!");
      setSelectedDeliverable({ ...selectedDeliverable, status: "in_review" });
    } catch (err: unknown) {
      setActionMsg(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    }
    setSubmittingAction(false);
  };

  const handleCreateShareLink = async () => {
    if (!selectedDeliverable) return;
    setSubmittingAction(true);
    try {
      const link = await api.createReviewLink(selectedDeliverable.id, 30);
      setReviewLinks((prev) => [...prev, link]);
      setShowShareLink(true);
    } catch (err: unknown) {
      setActionMsg(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    }
    setSubmittingAction(false);
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const statusColor = (s: string) => {
    if (s === "approved") return t.accent;
    if (s === "in_review") return "rgba(255,200,60,0.9)";
    if (s === "revision_requested") return "#ff6b6b";
    return t.textMuted;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: "Draft", in_review: "Awaiting Review",
      approved: "Approved", revision_requested: "Changes Requested",
      pending: "Pending",
    };
    return map[s] || s;
  };

  if (reviewableDeliverables.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={ff({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Client Review</h2>
          <p style={ff({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Track client feedback on deliverables.</p>
        </div>
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={ff({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No reviews yet</p>
          <p style={ff({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Send a deliverable for client review.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={ff({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Client Review</h2>
          <p style={ff({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
            Review video deliverables with timestamped comments.
          </p>
        </div>
        {selectedDeliverable && (
          <div style={{ display: "flex", gap: "8px" }}>
            {selectedDeliverable.status === "draft" && (
              <button
                onClick={handlePushForReview}
                disabled={submittingAction}
                style={ff({
                  fontWeight: 600, fontSize: "11px", color: t.accentText,
                  background: t.accent, border: "none", borderRadius: "6px",
                  padding: "8px 16px", cursor: "pointer",
                  opacity: submittingAction ? 0.5 : 1,
                })}
              >
                Push to Client
              </button>
            )}
            <button
              onClick={handleCreateShareLink}
              disabled={submittingAction}
              style={ff({
                fontWeight: 500, fontSize: "11px", color: t.text,
                background: "transparent", border: `1px solid ${t.border}`,
                borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Share Link
            </button>
          </div>
        )}
      </div>

      {actionMsg && (
        <div style={{
          padding: "10px 14px", marginBottom: "16px", borderRadius: "8px",
          background: actionMsg.startsWith("Error") ? "rgba(255,100,100,0.08)" : "rgba(96,208,96,0.08)",
          border: `1px solid ${actionMsg.startsWith("Error") ? "rgba(255,100,100,0.2)" : "rgba(96,208,96,0.2)"}`,
        }}>
          <p style={ff({
            fontWeight: 500, fontSize: "12px",
            color: actionMsg.startsWith("Error") ? "rgba(255,100,100,0.8)" : "rgba(96,208,96,0.8)",
          })}>{actionMsg}</p>
        </div>
      )}

      {showShareLink && reviewLinks.length > 0 && (
        <div style={{
          padding: "14px 16px", marginBottom: "16px", borderRadius: "8px",
          background: t.bgCard, border: `1px solid ${t.border}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={ff({ fontWeight: 600, fontSize: "12px", color: t.text })}>Share Links</p>
            <button onClick={() => setShowShareLink(false)} style={{
              background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: "16px",
            }}>x</button>
          </div>
          {reviewLinks.map((link) => (
            <div key={link.id} style={{
              display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px",
            }}>
              <input
                readOnly
                value={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/review/${link.token}`}
                style={ff({
                  fontWeight: 400, fontSize: "11px", color: t.textSecondary,
                  background: t.hoverBg, border: `1px solid ${t.borderSubtle}`,
                  borderRadius: "4px", padding: "6px 8px", flex: 1, outline: "none",
                })}
              />
              <button
                onClick={() => copyShareLink(link.token)}
                style={ff({
                  fontWeight: 600, fontSize: "10px", color: copiedLink ? "rgba(96,208,96,0.8)" : t.text,
                  background: t.hoverBg, border: `1px solid ${t.border}`,
                  borderRadius: "4px", padding: "6px 10px", cursor: "pointer",
                })}
              >
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {reviewableDeliverables.map((d: Deliverable) => (
          <button
            key={d.id}
            onClick={() => {
              setSelectedDeliverable(d);
              setActiveTimestamp(null);
              setActionMsg(null);
            }}
            style={ff({
              fontWeight: selectedDeliverable?.id === d.id ? 600 : 400,
              fontSize: "12px",
              color: selectedDeliverable?.id === d.id ? t.text : t.textMuted,
              background: selectedDeliverable?.id === d.id ? t.activeNav : "transparent",
              border: `1px solid ${selectedDeliverable?.id === d.id ? t.border : t.borderSubtle}`,
              borderRadius: "6px", padding: "8px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            })}
          >
            {d.title}
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: statusColor(d.status), display: "inline-block",
            }} />
          </button>
        ))}
      </div>

      {selectedDeliverable && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={ff({ fontWeight: 700, fontSize: "16px", color: t.text })}>{selectedDeliverable.title}</h3>
                <span style={ff({
                  fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em",
                  color: statusColor(selectedDeliverable.status),
                  background: `${statusColor(selectedDeliverable.status)}12`,
                  padding: "4px 12px", borderRadius: "4px",
                })}>{statusLabel(selectedDeliverable.status)}</span>
              </div>
              <span style={ff({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                {selectedDeliverable.version || "v1"} · {selectedDeliverable.type}
              </span>
            </div>

            {selectedDeliverable.fileUrl ? (
              <VideoPlayer
                src={selectedDeliverable.fileUrl}
                onTimeClick={(ts) => setActiveTimestamp(ts)}
                seekTo={seekTo ?? undefined}
                markers={comments.map((c) => ({
                  id: c.id,
                  timestampSeconds: c.timestampSeconds,
                  label: c.content.slice(0, 30),
                }))}
                onMarkerClick={handleMarkerClick}
              />
            ) : (
              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                padding: "80px", textAlign: "center",
              }}>
                <p style={ff({ fontWeight: 500, fontSize: "13px", color: t.textMuted })}>
                  No preview available for this deliverable.
                </p>
              </div>
            )}
          </div>

          <VideoReviewPanel
            comments={comments as VideoComment[]}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onCommentClick={handleCommentClick}
            activeTimestamp={activeTimestamp}
          />
        </div>
      )}
    </div>
  );
}
