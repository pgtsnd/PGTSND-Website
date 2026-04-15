import { useState } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

interface FileItem {
  name: string;
  type: "folder" | "video" | "image" | "pdf" | "zip";
  size?: string;
  date?: string;
  items?: number;
  thumbnail?: string;
  reviewStatus?: "none" | "in-review" | "approved";
}

const placeholderThumbnails = [
  "linear-gradient(135deg, #1a3a4a 0%, #2a5a6a 50%, #1a3a4a 100%)",
  "linear-gradient(135deg, #2a2a3a 0%, #3a3a5a 50%, #2a2a3a 100%)",
  "linear-gradient(135deg, #3a2a1a 0%, #5a4a2a 50%, #3a2a1a 100%)",
  "linear-gradient(135deg, #1a2a1a 0%, #2a4a2a 50%, #1a2a1a 100%)",
  "linear-gradient(135deg, #2a1a2a 0%, #4a2a4a 50%, #2a1a2a 100%)",
  "linear-gradient(135deg, #1a1a2a 0%, #2a2a4a 50%, #1a1a2a 100%)",
  "linear-gradient(135deg, #3a2a2a 0%, #5a3a3a 50%, #3a2a2a 100%)",
  "linear-gradient(135deg, #2a3a2a 0%, #3a5a3a 50%, #2a3a2a 100%)",
];

const folderStructure: Record<string, FileItem[]> = {
  "/": [
    { name: "Spring Campaign", type: "folder", items: 24 },
    { name: "Product Launch Teaser", type: "folder", items: 8 },
    { name: "Brand Assets", type: "folder", items: 6 },
  ],
  "/Spring Campaign": [
    { name: "Client Uploads", type: "folder", items: 4 },
    { name: "Raw Footage", type: "folder", items: 8 },
    { name: "Drafts", type: "folder", items: 3 },
    { name: "Final Deliverables", type: "folder", items: 2 },
    { name: "Stills & Photos", type: "folder", items: 7 },
  ],
  "/Spring Campaign/Client Uploads": [
    { name: "brand-guidelines-v2.pdf", type: "pdf", size: "4.2 MB", date: "Apr 10" },
    { name: "logo-package.zip", type: "zip", size: "12.8 MB", date: "Apr 8" },
    { name: "approved-taglines.pdf", type: "pdf", size: "840 KB", date: "Apr 6" },
    { name: "team-headshots.zip", type: "zip", size: "45.2 MB", date: "Apr 5" },
  ],
  "/Spring Campaign/Raw Footage": [
    { name: "interview-nicole-01.mp4", type: "video", size: "2.1 GB", date: "Apr 5", thumbnail: placeholderThumbnails[0] },
    { name: "interview-nicole-02.mp4", type: "video", size: "1.8 GB", date: "Apr 5", thumbnail: placeholderThumbnails[1] },
    { name: "b-roll-warehouse.mp4", type: "video", size: "3.4 GB", date: "Apr 4", thumbnail: placeholderThumbnails[2] },
    { name: "b-roll-dock-morning.mp4", type: "video", size: "2.7 GB", date: "Apr 4", thumbnail: placeholderThumbnails[3] },
    { name: "aerial-harbor-01.mp4", type: "video", size: "4.1 GB", date: "Apr 3", thumbnail: placeholderThumbnails[4] },
    { name: "aerial-harbor-02.mp4", type: "video", size: "3.8 GB", date: "Apr 3", thumbnail: placeholderThumbnails[5] },
    { name: "processing-floor.mp4", type: "video", size: "2.2 GB", date: "Apr 3", thumbnail: placeholderThumbnails[6] },
    { name: "crew-prep-deck.mp4", type: "video", size: "1.5 GB", date: "Apr 2", thumbnail: placeholderThumbnails[7] },
  ],
  "/Spring Campaign/Drafts": [
    { name: "spring-campaign-v3.mp4", type: "video", size: "890 MB", date: "Apr 14", reviewStatus: "in-review", thumbnail: placeholderThumbnails[0] },
    { name: "spring-campaign-v2.mp4", type: "video", size: "860 MB", date: "Apr 10", reviewStatus: "approved", thumbnail: placeholderThumbnails[1] },
    { name: "spring-campaign-v1.mp4", type: "video", size: "920 MB", date: "Apr 5", reviewStatus: "approved", thumbnail: placeholderThumbnails[2] },
  ],
  "/Spring Campaign/Final Deliverables": [
    { name: "spring-campaign-FINAL-16x9.mp4", type: "video", size: "1.2 GB", date: "—", thumbnail: placeholderThumbnails[3] },
    { name: "spring-campaign-FINAL-9x16.mp4", type: "video", size: "980 MB", date: "—", thumbnail: placeholderThumbnails[4] },
  ],
  "/Spring Campaign/Stills & Photos": [
    { name: "hero-shot-harbor.jpg", type: "image", size: "8.4 MB", date: "Apr 5", thumbnail: placeholderThumbnails[0] },
    { name: "crew-portrait-01.jpg", type: "image", size: "6.2 MB", date: "Apr 5", thumbnail: placeholderThumbnails[1] },
    { name: "product-close-up.jpg", type: "image", size: "5.8 MB", date: "Apr 4", thumbnail: placeholderThumbnails[2] },
    { name: "aerial-fleet.jpg", type: "image", size: "12.1 MB", date: "Apr 3", thumbnail: placeholderThumbnails[3] },
    { name: "nicole-interview-still.jpg", type: "image", size: "4.6 MB", date: "Apr 5", thumbnail: placeholderThumbnails[4] },
    { name: "dock-sunset.jpg", type: "image", size: "9.2 MB", date: "Apr 3", thumbnail: placeholderThumbnails[5] },
    { name: "processing-detail.jpg", type: "image", size: "5.1 MB", date: "Apr 3", thumbnail: placeholderThumbnails[6] },
  ],
  "/Product Launch Teaser": [
    { name: "Client Uploads", type: "folder", items: 2 },
    { name: "Drafts", type: "folder", items: 1 },
  ],
  "/Product Launch Teaser/Client Uploads": [
    { name: "product-photos-batch1.zip", type: "zip", size: "28.5 MB", date: "Apr 12" },
    { name: "launch-brief.pdf", type: "pdf", size: "1.1 MB", date: "Apr 10" },
  ],
  "/Product Launch Teaser/Drafts": [
    { name: "product-teaser-v1.mp4", type: "video", size: "420 MB", date: "Apr 12", reviewStatus: "none", thumbnail: placeholderThumbnails[5] },
  ],
  "/Brand Assets": [
    { name: "NYP-logo-full-color.png", type: "image", size: "2.4 MB", date: "Mar 1", thumbnail: placeholderThumbnails[0] },
    { name: "NYP-logo-white.png", type: "image", size: "1.8 MB", date: "Mar 1", thumbnail: placeholderThumbnails[1] },
    { name: "NYP-brand-colors.pdf", type: "pdf", size: "320 KB", date: "Mar 1" },
    { name: "NYP-brand-fonts.zip", type: "zip", size: "8.6 MB", date: "Mar 1" },
    { name: "NYP-brand-guidelines.pdf", type: "pdf", size: "6.2 MB", date: "Mar 1" },
    { name: "NYP-icon-set.zip", type: "zip", size: "3.4 MB", date: "Mar 1" },
  ],
};

function getTypeColor(type: string) {
  if (type === "video") return "rgba(120,180,255,0.6)";
  if (type === "image") return "rgba(160,220,120,0.6)";
  if (type === "pdf") return "rgba(255,120,120,0.6)";
  return "rgba(200,160,255,0.6)";
}

function getTypeLabel(type: string) {
  if (type === "video") return "MP4";
  if (type === "image") return "IMG";
  if (type === "pdf") return "PDF";
  return "ZIP";
}

export default function ClientAssets() {
  const { t } = useTheme();
  const [currentPath, setCurrentPath] = useState("/");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentFiles = folderStructure[currentPath] || [];
  const breadcrumbs = currentPath === "/" ? ["Files"] : ["Files", ...currentPath.slice(1).split("/")];
  const hasFiles = currentFiles.some((f) => f.type !== "folder");
  const hasFolders = currentFiles.some((f) => f.type === "folder");
  const isDraftsFolder = currentPath.includes("Drafts");

  const navigateTo = (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath(currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) setCurrentPath("/");
    else {
      const parts = currentPath.slice(1).split("/");
      setCurrentPath("/" + parts.slice(0, index).join("/"));
    }
  };

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Assets</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {hasFiles && (
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
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {mode === "grid" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "8px", padding: "10px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Upload
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {i > 0 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: i === breadcrumbs.length - 1 ? 600 : 400, fontSize: "13px", color: i === breadcrumbs.length - 1 ? t.text : t.textTertiary, background: "none", border: "none", cursor: "pointer", padding: "4px 2px" }}
              >
                {crumb}
              </button>
            </div>
          ))}
        </div>

        {currentPath === "/" && (
          <div
            style={{ border: `2px dashed ${t.border}`, borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "28px", cursor: "pointer", background: t.bgCard }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ margin: "0 auto 10px" }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.textMuted }}>Drop files here or click to upload</p>
          </div>
        )}

        {isDraftsFolder && (
          <div style={{ background: "rgba(120,180,255,0.04)", border: "1px solid rgba(120,180,255,0.12)", borderRadius: "10px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(120,180,255,0.7)" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: "rgba(120,180,255,0.8)" }}>Draft files can be sent to Video Review for client feedback</p>
            </div>
          </div>
        )}

        {hasFolders && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: hasFiles ? "32px" : "0" }}>
            {currentFiles.filter(f => f.type === "folder").map((item, i) => (
              <div
                key={i}
                onClick={() => navigateTo(item)}
                style={{ padding: "20px", borderRadius: "10px", background: t.bgCard, border: `1px solid ${t.border}`, cursor: "pointer", transition: "all 0.15s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.bgCardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = t.bgCard; }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,200,100,0.5)" stroke="none"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" }}>{item.name}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{item.items} items</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasFiles && viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {currentFiles.filter(f => f.type !== "folder").map((item, i) => (
              <div
                key={i}
                style={{ borderRadius: "10px", background: t.bgCard, border: `1px solid ${t.border}`, overflow: "hidden", cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.textMuted; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
              >
                <div style={{ height: "120px", background: item.thumbnail || t.videoPlayerBg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {(item.type === "video" || item.type === "image") && item.thumbnail ? (
                    <>
                      {item.type === "video" && (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      )}
                      {item.reviewStatus && item.reviewStatus !== "none" && (
                        <div style={{ position: "absolute", top: "8px", right: "8px", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: item.reviewStatus === "in-review" ? "rgba(255,200,60,0.9)" : "rgba(96,208,96,0.9)", color: "#000" }}>
                          {item.reviewStatus === "in-review" ? "In Review" : "Approved"}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "12px", color: getTypeColor(item.type), textTransform: "uppercase" }}>{getTypeLabel(item.type)}</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.text, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{item.size}</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{item.date}</span>
                  </div>
                  {isDraftsFolder && item.type === "video" && item.reviewStatus === "none" && (
                    <button style={{ marginTop: "8px", width: "100%", fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(120,180,255,0.9)", background: "rgba(120,180,255,0.08)", border: "1px solid rgba(120,180,255,0.15)", borderRadius: "5px", padding: "6px 10px", cursor: "pointer" }}>
                      Send to Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasFiles && viewMode === "list" && (
          <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 40px", padding: "10px 20px", borderBottom: `1px solid ${t.border}`, background: t.hoverBg }}>
              {["Name", "Size", "Date", "Status", ""].map((h) => (
                <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted }}>{h}</p>
              ))}
            </div>
            {currentFiles.filter(f => f.type !== "folder").map((item, i) => (
              <div
                key={i}
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 40px", padding: "14px 20px", borderBottom: `1px solid ${t.borderSubtle}`, alignItems: "center", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "4px", background: item.thumbnail || t.videoPlayerBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {!item.thumbnail && <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "7px", color: getTypeColor(item.type) }}>{getTypeLabel(item.type)}</span>}
                    {item.thumbnail && item.type === "video" && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white" opacity="0.7"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.text }}>{item.name}</p>
                </div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{item.size}</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{item.date}</p>
                <div>
                  {item.reviewStatus && item.reviewStatus !== "none" && (
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 8px", borderRadius: "4px", background: item.reviewStatus === "in-review" ? "rgba(255,200,60,0.08)" : "rgba(96,208,96,0.08)", color: item.reviewStatus === "in-review" ? "rgba(255,200,60,0.8)" : "rgba(96,208,96,0.8)" }}>
                      {item.reviewStatus === "in-review" ? "In Review" : "Approved"}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
