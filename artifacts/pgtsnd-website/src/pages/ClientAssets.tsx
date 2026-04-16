import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Deliverable, type Project, type DriveFolderGroup, type DriveFile } from "../lib/api";
import { AssetsSkeleton, ErrorState } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";

function formatShortDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getTypeColor(type: string) {
  if (type === "video") return "rgba(120,180,255,0.6)";
  if (type === "graphics") return "rgba(200,140,255,0.6)";
  if (type === "audio") return "rgba(255,180,100,0.6)";
  if (type === "document") return "rgba(100,220,180,0.6)";
  return "rgba(150,150,150,0.5)";
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    video: "Video",
    graphics: "Graphics",
    document: "Document",
    audio: "Audio",
    other: "File",
  };
  return labels[type] || type;
}

function getStatusDisplay(status: string) {
  switch (status) {
    case "approved": return { label: "Approved", color: "rgba(96,208,96,0.8)", bg: "rgba(96,208,96,0.08)" };
    case "in_review": return { label: "In Review", color: "rgba(255,200,60,0.8)", bg: "rgba(255,200,60,0.08)" };
    case "revision_requested": return { label: "Revisions", color: "rgba(255,120,120,0.8)", bg: "rgba(255,120,120,0.08)" };
    case "pending": return { label: "Pending", color: "rgba(120,180,255,0.7)", bg: "rgba(120,180,255,0.08)" };
    default: return { label: status, color: "rgba(150,150,150,0.7)", bg: "rgba(150,150,150,0.08)" };
  }
}

export default function ClientAssets() {
  const { t } = useTheme();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [driveGroups, setDriveGroups] = useState<DriveFolderGroup[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.getClientDeliverables(),
      api.getClientDashboard(),
      api.getClientDriveFiles().catch(() => [] as DriveFolderGroup[]),
    ])
      .then(([dels, dash, drive]) => {
        setDeliverables(dels);
        setProjects(dash.projects);
        setDriveGroups(drive);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const handleDownload = async (fileId: string, fallbackUrl: string) => {
    try {
      const { url } = await api.getClientDriveDownloadUrl(fileId);
      window.open(url || fallbackUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast("Couldn't get a secure download link, opening original", "info");
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  };

  const driveFilesFlat: { group: DriveFolderGroup; file: DriveFile }[] =
    driveGroups.flatMap((g) => g.files.map((f) => ({ group: g, file: f })));

  const filteredDeliverables = selectedProject === "all"
    ? deliverables
    : deliverables.filter((d) => d.projectId === selectedProject);

  const filteredDriveFiles = selectedProject === "all"
    ? driveFilesFlat
    : driveFilesFlat.filter((d) => d.group.projectId === selectedProject);

  const filtered = filteredDeliverables;
  const totalCount = deliverables.length + driveFilesFlat.length;

  if (loading) {
    return (
      <ClientLayout>
        <AssetsSkeleton />
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState
            message="We couldn't load your assets. Please check your connection and try again."
            onRetry={refetch}
          />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Assets</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {totalCount > 0 && (
              <div style={{ display: "flex", border: `1px solid ${t.border}`, borderRadius: "6px", overflow: "hidden" }}>
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "7px 12px",
                      background: viewMode === mode ? t.activeNav : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: viewMode === mode ? t.text : t.textMuted,
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {mode === "grid" ? "Grid" : "List"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button
            onClick={() => setSelectedProject("all")}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: selectedProject === "all" ? 600 : 400,
              fontSize: "12px",
              color: selectedProject === "all" ? t.text : t.textTertiary,
              background: selectedProject === "all" ? t.activeNav : "transparent",
              border: `1px solid ${selectedProject === "all" ? t.border : t.borderSubtle}`,
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            All ({totalCount})
          </button>
          {projects.map((p) => {
            const delCount = deliverables.filter((d) => d.projectId === p.id).length;
            const driveCount = driveFilesFlat.filter((d) => d.group.projectId === p.id).length;
            const count = delCount + driveCount;
            if (count === 0) return null;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: selectedProject === p.id ? 600 : 400,
                  fontSize: "12px",
                  color: selectedProject === p.id ? t.text : t.textTertiary,
                  background: selectedProject === p.id ? t.activeNav : "transparent",
                  border: `1px solid ${selectedProject === p.id ? t.border : t.borderSubtle}`,
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                {p.name} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && filteredDriveFiles.length === 0 ? (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" }}>No assets yet</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Deliverables will appear here as your team uploads them.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
            {filtered.map((item) => {
              const sd = getStatusDisplay(item.status);
              return (
                <div key={item.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ height: "120px", background: `linear-gradient(135deg, ${getTypeColor(item.type)} 0%, transparent 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>
                      {getTypeLabel(item.type)}
                    </span>
                    <span style={{ position: "absolute", top: "8px", right: "8px", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", color: sd.color, background: sd.bg, padding: "2px 8px", borderRadius: "4px" }}>{sd.label}</span>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                        {item.createdAt ? formatShortDate(item.createdAt) : "—"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                      {item.projectName}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredDriveFiles.map(({ group, file }) => (
              <div key={`drive-${file.id}`} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ height: "120px", background: file.thumbnailLink ? `url(${file.thumbnailLink}) center/cover no-repeat` : `linear-gradient(135deg, rgba(120,180,255,0.4) 0%, transparent 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {!file.thumbnailLink && (
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>Drive</span>
                  )}
                  <span style={{ position: "absolute", top: "8px", right: "8px", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", color: "rgba(120,180,255,0.9)", background: "rgba(120,180,255,0.12)", padding: "2px 8px", borderRadius: "4px" }}>Drive</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{formatShortDate(file.modifiedTime)}</span>
                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); handleDownload(file.id, file.webViewLink); }} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", color: t.accent, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Download</a>
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>{group.projectName}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 40px", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.hoverBg }}>
              {["Name", "Type", "Status", "Date", ""].map((h) => (
                <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted }}>{h}</p>
              ))}
            </div>
            {filtered.map((item) => {
              const sd = getStatusDisplay(item.status);
              return (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 40px", padding: "14px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" }}>{item.title}</p>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>{item.projectName}</span>
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary }}>{getTypeLabel(item.type)}</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", color: sd.color, background: sd.bg, padding: "3px 10px", borderRadius: "4px", display: "inline-block", textAlign: "center" }}>{sd.label}</span>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{timeAgo(item.updatedAt)}</p>
                  <div style={{ textAlign: "right" }}>
                    {item.fileUrl && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredDriveFiles.map(({ group, file }) => (
              <div key={`drive-list-${file.id}`} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 40px", padding: "14px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" }}>{file.name}</p>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>{group.projectName}</span>
                </div>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary }}>Drive</span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", color: "rgba(120,180,255,0.9)", background: "rgba(120,180,255,0.12)", padding: "3px 10px", borderRadius: "4px", display: "inline-block", textAlign: "center" }}>Synced</span>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{timeAgo(file.modifiedTime)}</p>
                <div style={{ textAlign: "right" }}>
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); handleDownload(file.id, file.webViewLink); }} title="Download" style={{ display: "inline-block" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
