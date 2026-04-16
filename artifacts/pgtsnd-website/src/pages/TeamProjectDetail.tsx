import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { ProjectDetailSkeleton, ErrorState } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import type { VideoComment } from "../components/VideoReviewPanel";
import { api, type VideoCommentWithReplies, type ReviewLinkData, type DeliverableVersion } from "../lib/api";
import { csrfHeaders } from "../lib/csrf";
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
  useUpdateProject,
  useUpdateDeliverable,
} from "@workspace/api-client-react";
import {
  useIntegrationStatus,
  useDriveFolders,
  useSlackChannels,
} from "../hooks/useIntegrations";

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
  const queryClient = useQueryClient();

  const { project, members, tasks, deliverables, contracts, isLoading, isError, refetch } =
    useProjectWithDetails(projectId);

  useEffect(() => {
    setActiveTab("overview");
  }, [projectId]);

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <ProjectDetailSkeleton />
      </TeamLayout>
    );
  }

  if (isError) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <Link href="/team/projects" style={f({ fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Projects
          </Link>
          <ErrorState message="We couldn't load this project. Please check your connection and try again." onRetry={refetch} />
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
          <DeliverablesTab deliverables={deliverables} onRefresh={refetch} />
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
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px", marginBottom: "32px" }}>
            <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.6 })}>{project.description}</p>
          </div>
        </>
      )}

      <ProjectIntegrationsCard project={project} projectId={projectId} />
    </div>
  );
}

function ProjectIntegrationsCard({ project, projectId }: { project: any; projectId: string }) {
  const { t } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const { data: status } = useIntegrationStatus();
  const driveConnected = !!status?.google_drive;
  const slackConnected = !!status?.slack;

  const { data: folders, isLoading: foldersLoading, isError: foldersError } = useDriveFolders(driveConnected);
  const { data: channels, isLoading: channelsLoading, isError: channelsError } = useSlackChannels(slackConnected);

  const updateProject = useUpdateProject();

  const [driveValue, setDriveValue] = useState<string>(project.driveFolderId || "");
  const [drivePasteMode, setDrivePasteMode] = useState<boolean>(
    !!project.driveFolderId && !!folders && !folders.some((folder) => folder.id === project.driveFolderId),
  );
  const [slackValue, setSlackValue] = useState<string>(project.slackChannelId || "");

  useEffect(() => {
    setDriveValue(project.driveFolderId || "");
  }, [project.driveFolderId]);

  useEffect(() => {
    setSlackValue(project.slackChannelId || "");
  }, [project.slackChannelId]);

  useEffect(() => {
    if (project.driveFolderId && folders && !folders.some((folder) => folder.id === project.driveFolderId)) {
      setDrivePasteMode(true);
    }
  }, [folders, project.driveFolderId]);

  const driveDirty = (project.driveFolderId || "") !== driveValue.trim();
  const slackDirty = (project.slackChannelId || "") !== slackValue.trim();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  };

  const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const handleSaveDrive = () => {
    updateProject.mutate(
      { id: projectId, data: { driveFolderId: driveValue.trim() || null } },
      {
        onSuccess: () => { invalidate(); toast("Drive folder updated", "success"); },
        onError: (err) => toast(errorMessage(err, "Failed to update Drive folder"), "error"),
      },
    );
  };

  const handleSaveSlack = () => {
    updateProject.mutate(
      { id: projectId, data: { slackChannelId: slackValue.trim() || null } },
      {
        onSuccess: () => { invalidate(); toast("Slack channel updated", "success"); },
        onError: (err) => toast(errorMessage(err, "Failed to update Slack channel"), "error"),
      },
    );
  };

  const fieldLabel: React.CSSProperties = f({
    fontWeight: 700, fontSize: "10px", textTransform: "uppercase",
    letterSpacing: "0.08em", color: t.textMuted, marginBottom: "8px", display: "block",
  });
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: "6px",
    background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
    outline: "none", boxSizing: "border-box",
    ...f({ fontWeight: 400, fontSize: "13px" }),
  };
  const primaryBtn = (disabled: boolean): React.CSSProperties => f({
    fontWeight: 600, fontSize: "11px", color: t.accentText,
    background: t.accent, border: "none", borderRadius: "6px",
    padding: "8px 14px", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  });
  const linkBtn: React.CSSProperties = f({
    fontWeight: 500, fontSize: "11px", color: t.textMuted,
    background: "transparent", border: "none", cursor: "pointer", padding: 0,
    textDecoration: "underline",
  });

  return (
    <>
      <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
        Integrations
      </h3>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px", marginBottom: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={fieldLabel}>Google Drive Folder</label>
            {!driveConnected ? (
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                Google Drive isn't connected. Ask an owner to enable it under <Link href="/team/settings" style={{ color: t.accent, textDecoration: "none" }}>Settings → Integrations</Link>.
              </p>
            ) : (
              <>
                {!drivePasteMode ? (
                  <select
                    value={driveValue}
                    onChange={(e) => setDriveValue(e.target.value)}
                    disabled={foldersLoading}
                    style={inputStyle}
                  >
                    <option value="">
                      {foldersLoading ? "Loading folders…" : foldersError ? "Failed to load — try paste" : "— No folder selected —"}
                    </option>
                    {(folders || []).map((folder) => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={driveValue}
                    onChange={(e) => setDriveValue(e.target.value)}
                    placeholder="Paste folder ID from Drive URL"
                    style={inputStyle}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", gap: "8px" }}>
                  <button onClick={() => setDrivePasteMode((v) => !v)} style={linkBtn} type="button">
                    {drivePasteMode ? "Choose from list" : "Paste folder ID"}
                  </button>
                  <button
                    onClick={handleSaveDrive}
                    disabled={!driveDirty || updateProject.isPending}
                    style={primaryBtn(!driveDirty || updateProject.isPending)}
                    type="button"
                  >
                    {updateProject.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "8px" })}>
                  Drives the Assets tab and Client Hub file listings.
                </p>
              </>
            )}
          </div>

          <div>
            <label style={fieldLabel}>Slack Channel</label>
            {!slackConnected ? (
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                Slack isn't connected. Ask an owner to enable it under <Link href="/team/settings" style={{ color: t.accent, textDecoration: "none" }}>Settings → Integrations</Link>.
              </p>
            ) : (
              <>
                <select
                  value={slackValue}
                  onChange={(e) => setSlackValue(e.target.value)}
                  disabled={channelsLoading}
                  style={inputStyle}
                >
                  <option value="">
                    {channelsLoading ? "Loading channels…" : channelsError ? "Failed to load channels" : "— No channel selected —"}
                  </option>
                  {(channels || []).map((channel) => (
                    <option key={channel.id} value={channel.id}>#{channel.name}</option>
                  ))}
                  {slackValue && !(channels || []).some((c) => c.id === slackValue) && (
                    <option value={slackValue}>{slackValue} (not in list)</option>
                  )}
                </select>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    onClick={handleSaveSlack}
                    disabled={!slackDirty || updateProject.isPending}
                    style={primaryBtn(!slackDirty || updateProject.isPending)}
                    type="button"
                  >
                    {updateProject.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "8px" })}>
                  Drives the Messages tab and Client Hub chat.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MilestoneRow({ task, projectId, onRefresh }: { task: Task; projectId: string; onRefresh: () => void }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expanded, setExpanded] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await api.createTaskItem(task.id, { title: newTaskTitle.trim(), sortOrder: (items?.length ?? 0) + 1 });
    setNewTaskTitle("");
    setShowAddTask(false);
    refetch();
  };

  const handleDeleteTask = async (itemId: string) => {
    await api.deleteTaskItem(itemId);
    refetch();
  };

  const handleDeleteMilestone = async () => {
    await api.deleteTask(task.id);
    onRefresh();
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
      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "grid", gridTemplateColumns: "28px 1fr 100px 80px 80px 28px",
          alignItems: "center", gap: "8px",
          padding: "10px 12px", cursor: "pointer",
          borderBottom: expanded ? `1px solid ${t.border}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {task.status === "done" ? (
            <div style={{
              width: "18px", height: "18px", borderRadius: "4px", background: t.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"
              style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>

        <div>
          <p style={f({
            fontWeight: 600, fontSize: "12px", color: t.text,
            textDecoration: task.status === "done" ? "line-through" : "none",
            opacity: task.status === "done" ? 0.6 : 1,
          })}>{task.title}</p>
        </div>

        <div>
          <span style={f({
            fontWeight: 500, fontSize: "9px", textTransform: "uppercase",
            color: statusColors[task.status] ?? t.textMuted,
            background: task.status === "done" ? "rgba(255,255,255,0.04)" : t.hoverBg,
            padding: "3px 8px", borderRadius: "4px",
          })}>{statusLabels[task.status] ?? task.status}</span>
        </div>

        <div>
          {task.dueDate && (
            <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
            <div style={{ width: "36px", height: "3px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${task.progress}%`, height: "100%", background: statusColors[task.status] ?? t.textMuted, borderRadius: "2px" }} />
            </div>
            <span style={f({ fontWeight: 600, fontSize: "8px", color: t.textMuted })}>{task.progress}%</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", opacity: 0.3, display: "flex" }}
            title="Delete milestone"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div style={{ padding: "12px 16px", background: "rgba(255,80,80,0.05)", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text })}>Delete this milestone?</p>
          <button onClick={handleDeleteMilestone} style={f({ fontWeight: 600, fontSize: "11px", color: "#fff", background: "#e04040", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer" })}>Delete</button>
          <button onClick={() => setConfirmDelete(false)} style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "4px", padding: "4px 12px", cursor: "pointer" })}>Cancel</button>
        </div>
      )}

      {expanded && (
        <div style={{ padding: "0" }}>
          {task.description && (
            <div style={{ padding: "10px 16px 0 48px" }}>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, lineHeight: 1.5 })}>{task.description}</p>
            </div>
          )}

          {items && items.length > 0 ? (
            <div style={{ padding: "10px 16px 12px 48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>
                  Tasks
                </p>
                <span style={f({ fontWeight: 500, fontSize: "9px", color: t.textMuted })}>
                  {completedItems}/{totalItems}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "6px 10px", borderRadius: "5px",
                      background: item.completed ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${t.borderSubtle}`,
                    }}
                  >
                    <div
                      onClick={(e) => { e.stopPropagation(); handleToggleItem(item.id, item.completed); }}
                      style={{
                        width: "15px", height: "15px", borderRadius: "3px", flexShrink: 0,
                        border: item.completed ? "none" : `1.5px solid ${t.textMuted}`,
                        background: item.completed ? t.accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s", cursor: "pointer",
                      }}>
                      {item.completed && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <span style={f({
                      fontWeight: 400, fontSize: "11px", flex: 1,
                      color: item.completed ? t.textMuted : t.textSecondary,
                      textDecoration: item.completed ? "line-through" : "none",
                    })}>{item.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(item.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", opacity: 0.25, display: "flex" }}
                      title="Delete task"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : items && items.length === 0 ? (
            <div style={{ padding: "10px 16px 6px 48px" }}>
              <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>No tasks yet.</p>
            </div>
          ) : (
            <div style={{ padding: "10px 16px 6px 48px" }}>
              <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Loading...</p>
            </div>
          )}

          <div style={{ padding: "0 16px 12px 48px" }}>
            {showAddTask ? (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Task name..."
                  autoFocus
                  style={{
                    flex: 1, padding: "6px 10px", borderRadius: "5px",
                    background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
                    outline: "none", ...f({ fontWeight: 400, fontSize: "11px" }),
                  }}
                />
                <button onClick={handleAddTask} style={f({ fontWeight: 600, fontSize: "10px", color: t.accentText, background: t.accent, border: "none", borderRadius: "4px", padding: "5px 10px", cursor: "pointer" })}>Add</button>
                <button onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }} style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, background: "transparent", border: "none", cursor: "pointer" })}>Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                style={f({
                  fontWeight: 500, fontSize: "10px", color: t.textMuted,
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "4px", padding: "4px 0",
                })}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseSection({ phase, tasks, projectId, onRefresh, readOnly = false }: {
  phase: { id: string; name: string; sortOrder: number };
  tasks: Task[];
  projectId: string;
  onRefresh: () => void;
  readOnly?: boolean;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expanded, setExpanded] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const phasePct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    await api.createTask(projectId, { title: newMilestoneTitle.trim(), phaseId: phase.id, status: "todo", sortOrder: tasks.length + 1 });
    setNewMilestoneTitle("");
    setShowAddMilestone(false);
    onRefresh();
  };

  const handleDeletePhase = async () => {
    await api.deletePhase(phase.id);
    onRefresh();
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 0", cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth="2"
          style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <h3 style={f({ fontWeight: 700, fontSize: "13px", color: t.text, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 })}>
          {phase.name}
        </h3>
        <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>
          {doneTasks}/{tasks.length}
        </span>
        <div style={{ flex: 1, maxWidth: "80px", height: "3px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: `${phasePct}%`, height: "100%", background: phasePct === 100 ? t.accent : "rgba(255,200,60,0.7)", borderRadius: "2px", transition: "width 0.3s" }} />
        </div>
        <span style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted })}>{phasePct}%</span>
        {!readOnly && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddMilestone(true); }}
              style={f({
                fontWeight: 500, fontSize: "9px", color: t.textMuted,
                background: "transparent", border: `1px solid ${t.borderSubtle}`,
                borderRadius: "4px", padding: "3px 8px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "3px",
              })}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Milestone
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", opacity: 0.3, display: "flex" }}
              title="Delete phase"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div style={{ padding: "10px 16px", marginBottom: "8px", background: "rgba(255,80,80,0.05)", border: `1px solid ${t.border}`, borderRadius: "6px", display: "flex", alignItems: "center", gap: "12px" }}>
          <p style={f({ fontWeight: 500, fontSize: "12px", color: t.text })}>Delete "{phase.name}" and unassign its milestones?</p>
          <button onClick={handleDeletePhase} style={f({ fontWeight: 600, fontSize: "11px", color: "#fff", background: "#e04040", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer" })}>Delete</button>
          <button onClick={() => setConfirmDelete(false)} style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "4px", padding: "4px 12px", cursor: "pointer" })}>Cancel</button>
        </div>
      )}

      {showAddMilestone && (
        <div style={{ padding: "0 0 8px 24px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
              placeholder="Milestone name..."
              autoFocus
              style={{
                flex: 1, padding: "8px 12px", borderRadius: "6px",
                background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
                outline: "none", ...f({ fontWeight: 400, fontSize: "12px" }),
              }}
            />
            <button onClick={handleAddMilestone} style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "5px", padding: "7px 14px", cursor: "pointer" })}>Add</button>
            <button onClick={() => { setShowAddMilestone(false); setNewMilestoneTitle(""); }} style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted, background: "transparent", border: "none", cursor: "pointer" })}>Cancel</button>
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {tasks.length > 0 ? tasks.map((task: Task) => (
            <MilestoneRow key={task.id} task={task} projectId={projectId} onRefresh={onRefresh} />
          )) : (
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, padding: "8px 0" })}>No milestones in this phase.</p>
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
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [phases, setPhases] = useState<{ id: string; name: string; sortOrder: number }[]>([]);
  const queryClient = useQueryClient();

  const loadPhases = useCallback(() => {
    api.getProjectPhases(projectId).then((p) => {
      setPhases(p.sort((a, b) => a.sortOrder - b.sortOrder));
    }).catch(() => {});
  }, [projectId]);

  useEffect(() => { loadPhases(); }, [loadPhases]);

  const handleRefresh = () => {
    loadPhases();
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
  };

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return;
    await api.createPhase(projectId, { name: newPhaseName.trim(), sortOrder: phases.length });
    setNewPhaseName("");
    setShowAddPhase(false);
    loadPhases();
  };

  const tasksByPhase = new Map<string, Task[]>();
  const unassigned: Task[] = [];
  for (const task of tasks) {
    const pid = (task as any).phaseId;
    if (pid) {
      if (!tasksByPhase.has(pid)) tasksByPhase.set(pid, []);
      tasksByPhase.get(pid)!.push(task);
    } else {
      unassigned.push(task);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Milestones</h2>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
            {doneTasks} of {tasks.length} complete · {inProgressTasks} in progress
          </p>
        </div>
        <button
          onClick={() => setShowAddPhase(true)}
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
          Add Phase
        </button>
      </div>

      {showAddPhase && (
        <div style={{ marginBottom: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
            placeholder="Phase name (e.g. Pre-Production, Production...)"
            autoFocus
            style={{
              flex: 1, padding: "10px 12px", borderRadius: "6px",
              background: t.hoverBg, border: `1px solid ${t.border}`, color: t.text,
              outline: "none", ...f({ fontWeight: 400, fontSize: "13px" }),
            }}
          />
          <button onClick={handleAddPhase} style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "9px 18px", cursor: "pointer" })}>Add</button>
          <button onClick={() => { setShowAddPhase(false); setNewPhaseName(""); }} style={f({ fontWeight: 500, fontSize: "12px", color: t.textMuted, background: "transparent", border: "none", cursor: "pointer" })}>Cancel</button>
        </div>
      )}

      <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ height: "100%", width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%`, background: t.accent, borderRadius: "3px", transition: "width 0.3s" }} />
      </div>

      {phases.map((phase) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          tasks={(tasksByPhase.get(phase.id) || []).sort((a, b) => a.sortOrder - b.sortOrder)}
          projectId={projectId}
          onRefresh={handleRefresh}
        />
      ))}

      {unassigned.length > 0 && (
        <PhaseSection
          phase={{ id: "__unassigned__", name: "Unassigned", sortOrder: 999 }}
          tasks={unassigned.sort((a, b) => a.sortOrder - b.sortOrder)}
          projectId={projectId}
          onRefresh={handleRefresh}
          readOnly
        />
      )}
    </div>
  );
}

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".webm"];
const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

function DeliverablesTab({ deliverables, onRefresh }: { deliverables: Deliverable[]; onRefresh: () => void }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [versionsByDeliverable, setVersionsByDeliverable] = useState<Record<string, DeliverableVersion[]>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const updateDeliverable = useUpdateDeliverable();
  const { toast } = useToast();

  const loadVersions = useCallback(async (deliverableId: string) => {
    try {
      const versions = await api.getDeliverableVersions(deliverableId);
      setVersionsByDeliverable((prev) => ({ ...prev, [deliverableId]: versions }));
    } catch {
      setVersionsByDeliverable((prev) => ({ ...prev, [deliverableId]: [] }));
    }
  }, []);

  useEffect(() => {
    if (expandedId) loadVersions(expandedId);
  }, [expandedId, loadVersions]);

  const validateVideoFile = (file: File): string | null => {
    const isAcceptedType = ACCEPTED_VIDEO_TYPES.includes(file.type);
    const isAcceptedExt = ACCEPTED_VIDEO_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAcceptedType && !isAcceptedExt) {
      return "Please choose an MP4 or WebM video file.";
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return "Video file must be under 2 GB.";
    }
    return null;
  };

  const handleVideoUpload = async (deliverableId: string, file: File) => {
    const validationError = validateVideoFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast(validationError, "error");
      return;
    }
    setUploadError(null);
    setUploadingFor(deliverableId);
    setUploadProgress(5);

    try {
      const contentType = file.type || (file.name.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4");
      const reqRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ name: file.name, size: file.size, contentType }),
      });
      if (!reqRes.ok) {
        const data = await reqRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start upload");
      }
      const { uploadURL, objectPath } = (await reqRes.json()) as { uploadURL: string; objectPath: string };

      setUploadProgress(15);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 15 + Math.round((e.loaded / e.total) * 80);
            setUploadProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setUploadProgress(98);
      const fileUrl = `/api/storage${objectPath}`;
      await new Promise<void>((resolve, reject) => {
        updateDeliverable.mutate(
          { id: deliverableId, data: { fileUrl, type: "video" } },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err instanceof Error ? err : new Error("Failed to save deliverable")),
          },
        );
      });

      setUploadProgress(100);
      toast("Video uploaded.", "success");
      onRefresh();
      void loadVersions(deliverableId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      toast(msg, "error");
    } finally {
      setUploadingFor(null);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const triggerFilePicker = (deliverableId: string) => {
    setUploadError(null);
    fileInputs.current[deliverableId]?.click();
  };

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
                  {d.fileUrl && d.type === "video" ? (
                    <div
                      data-testid={`deliverable-preview-${d.id}`}
                      style={{
                        width: "80px", height: "45px", borderRadius: "4px",
                        overflow: "hidden", flexShrink: 0, background: "#000",
                        border: `1px solid ${t.borderSubtle}`,
                      }}
                    >
                      <video
                        key={d.fileUrl}
                        src={`${d.fileUrl}#t=0.1`}
                        preload="metadata"
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                  ) : (
                    <div style={{ color: t.textMuted, flexShrink: 0 }}>
                      {typeIcons[d.type] ?? typeIcons.other}
                    </div>
                  )}
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

                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {d.fileUrl && (
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
                        )}

                        <div
                          onDragOver={(e) => {
                            if (uploadingFor) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "copy";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (uploadingFor) return;
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleVideoUpload(d.id, file);
                          }}
                          style={{
                            border: `2px dashed ${t.border}`, borderRadius: "8px",
                            padding: "14px 16px", display: "flex", alignItems: "center",
                            gap: "12px", justifyContent: "space-between",
                            background: uploadingFor === d.id ? "rgba(255,255,255,0.02)" : "transparent",
                          }}
                          data-testid={`deliverable-upload-zone-${d.id}`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted })}>
                              {d.fileUrl
                                ? "Drag a new MP4/WebM video here or "
                                : "Drag an MP4/WebM video here or "}
                              <button
                                type="button"
                                onClick={() => triggerFilePicker(d.id)}
                                disabled={uploadingFor !== null}
                                data-testid={`deliverable-upload-button-${d.id}`}
                                style={f({
                                  fontWeight: 600, fontSize: "11px", color: t.accent,
                                  background: "transparent", border: "none", padding: 0,
                                  cursor: uploadingFor ? "not-allowed" : "pointer",
                                  textDecoration: "underline",
                                })}
                              >
                                {d.fileUrl ? "replace video" : "browse"}
                              </button>
                            </p>
                          </div>
                          <input
                            ref={(el) => { fileInputs.current[d.id] = el; }}
                            type="file"
                            accept="video/mp4,video/webm,.mp4,.webm"
                            data-testid={`deliverable-upload-input-${d.id}`}
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoUpload(d.id, file);
                              e.target.value = "";
                            }}
                          />
                        </div>

                        {uploadingFor === d.id && (
                          <div data-testid={`deliverable-upload-progress-${d.id}`}>
                            <div style={{
                              width: "100%", height: "4px", borderRadius: "2px",
                              background: t.borderSubtle, overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${uploadProgress}%`, height: "100%",
                                background: t.accent, transition: "width 0.2s",
                              }} />
                            </div>
                            <p style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, marginTop: "6px" })}>
                              Uploading… {uploadProgress}%
                            </p>
                          </div>
                        )}

                        {uploadingFor !== d.id && uploadError && expandedId === d.id && (
                          <p style={f({ fontWeight: 500, fontSize: "11px", color: "#ff6b6b" })}>
                            {uploadError}
                          </p>
                        )}
                      </div>

                      {(() => {
                        const versions = versionsByDeliverable[d.id] ?? [];
                        const previousCuts = versions.filter((v) => v.fileUrl !== d.fileUrl);
                        if (previousCuts.length === 0) return null;
                        return (
                          <div
                            data-testid={`deliverable-previous-cuts-${d.id}`}
                            style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${t.borderSubtle}` }}
                          >
                            <p style={f({
                              fontWeight: 700, fontSize: "10px", color: t.textMuted,
                              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px",
                            })}>
                              Previous cuts ({previousCuts.length})
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {previousCuts.map((v) => (
                                <div
                                  key={v.id}
                                  data-testid={`deliverable-previous-cut-${v.id}`}
                                  style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "8px 12px",
                                    background: t.hoverBg,
                                    border: `1px solid ${t.borderSubtle}`,
                                    borderRadius: "6px",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={f({
                                      fontWeight: 700, fontSize: "10px", color: t.text,
                                      background: t.bgCard, border: `1px solid ${t.border}`,
                                      borderRadius: "4px", padding: "2px 8px",
                                    })}>
                                      {v.version}
                                    </span>
                                    <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                                      Uploaded {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                  </div>
                                  <a
                                    href={v.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={f({
                                      fontWeight: 600, fontSize: "11px", color: t.accent, textDecoration: "none",
                                      display: "inline-flex", alignItems: "center", gap: "4px",
                                    })}
                                  >
                                    View
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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
  const { toast } = useToast();
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [comments, setComments] = useState<VideoCommentWithReplies[]>([]);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [reviewLinks, setReviewLinks] = useState<ReviewLinkData[]>([]);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [versions, setVersions] = useState<DeliverableVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

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
    setSelectedVersionId(null);
    api.getVideoComments(selectedDeliverable.id).then(setComments).catch(() => setComments([]));
    api.getReviewLinks(selectedDeliverable.id).then(setReviewLinks).catch(() => setReviewLinks([]));
    api.getDeliverableVersions(selectedDeliverable.id).then(setVersions).catch(() => setVersions([]));
  }, [selectedDeliverable?.id]);

  const activeVersion = selectedVersionId
    ? versions.find((v) => v.id === selectedVersionId) ?? null
    : null;
  const activeFileUrl = activeVersion?.fileUrl ?? selectedDeliverable?.fileUrl ?? null;
  const activeVersionLabel = activeVersion?.version ?? selectedDeliverable?.version ?? "v1";
  const isViewingPreviousCut = !!activeVersion && activeVersion.fileUrl !== selectedDeliverable?.fileUrl;

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

  const handleResolveComment = useCallback(
    async (commentId: string, resolved: boolean, note?: string) => {
      const updated = await api.resolveVideoComment(commentId, resolved, note);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)),
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
      toast("Deliverable pushed for client review", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setActionMsg(`Error: ${msg}`);
      toast(`Failed to push for review: ${msg}`, "error");
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
      toast("Share link created", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setActionMsg(`Error: ${msg}`);
      toast(`Failed to create share link: ${msg}`, "error");
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {versions.length > 0 && (
                  <select
                    data-testid="review-version-select"
                    value={selectedVersionId ?? ""}
                    onChange={(e) => setSelectedVersionId(e.target.value || null)}
                    style={ff({
                      fontWeight: 500, fontSize: "11px", color: t.text,
                      background: t.bgCard, border: `1px solid ${t.border}`,
                      borderRadius: "6px", padding: "6px 10px", cursor: "pointer", outline: "none",
                    })}
                  >
                    <option value="">
                      Latest ({selectedDeliverable.version || "v1"})
                    </option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.version} · {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </option>
                    ))}
                  </select>
                )}
                <span style={ff({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                  {activeVersionLabel} · {selectedDeliverable.type}
                </span>
              </div>
            </div>

            {isViewingPreviousCut && (
              <div
                data-testid="review-previous-version-banner"
                style={{
                  padding: "8px 12px", marginBottom: "10px", borderRadius: "6px",
                  background: "rgba(255,200,60,0.08)", border: "1px solid rgba(255,200,60,0.2)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <p style={ff({ fontWeight: 500, fontSize: "11px", color: "rgba(255,200,60,0.9)" })}>
                  Viewing previous cut {activeVersionLabel} (latest is {selectedDeliverable.version || "v1"})
                </p>
                <button
                  onClick={() => setSelectedVersionId(null)}
                  style={ff({
                    fontWeight: 600, fontSize: "10px", color: t.text,
                    background: "transparent", border: `1px solid ${t.border}`,
                    borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
                  })}
                >
                  Back to latest
                </button>
              </div>
            )}

            {activeFileUrl ? (
              <VideoPlayer
                key={activeFileUrl}
                src={activeFileUrl}
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
            onResolveComment={handleResolveComment}
          />
        </div>
      )}
    </div>
  );
}
