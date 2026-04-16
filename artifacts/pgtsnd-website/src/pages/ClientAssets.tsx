import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Deliverable, type Project } from "../lib/api";

function formatShortDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTypeColor(type: string) {
  if (type === "video") return "rgba(120,180,255,0.6)";
  if (type === "graphics") return "rgba(200,140,255,0.6)";
  if (type === "document") return "rgba(120,220,160,0.6)";
  if (type === "audio") return "rgba(255,180,100,0.6)";
  return "rgba(160,160,200,0.6)";
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

export default function ClientAssets() {
  const { t } = useTheme();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getClientDeliverables(),
      api.getClientDashboard(),
    ])
      .then(([d, dash]) => {
        const approvedAssets = d.filter(
          (item) => item.status === "approved",
        );
        setDeliverables(approvedAssets);
        setProjects(dash.projects);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedProject === "all"
    ? deliverables
    : deliverables.filter((d) => d.projectId === selectedProject);

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

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Assets</h1>
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
            All Projects
          </button>
          {projects.map((p) => (
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
              {p.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textMuted }}>
              No approved assets yet. Files will appear here once your team's deliverables are approved.
            </p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted, marginTop: "8px" }}>
              Google Drive integration coming soon
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{ borderRadius: "10px", background: t.bgCard, border: `1px solid ${t.border}`, overflow: "hidden", cursor: "pointer", transition: "all 0.15s ease" }}
              >
                <div style={{ height: "100px", background: t.videoPlayerBg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "14px", color: getTypeColor(item.type), textTransform: "uppercase" }}>
                    {getTypeLabel(item.type)}
                  </span>
                  <div style={{ position: "absolute", top: "8px", right: "8px", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(96,208,96,0.9)", color: "#000" }}>
                    Approved
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      {item.version || "v1"}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      {item.createdAt ? formatShortDate(item.createdAt) : "—"}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                    {item.projectName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
