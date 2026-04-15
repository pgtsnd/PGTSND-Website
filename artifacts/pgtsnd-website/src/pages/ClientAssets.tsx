import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

interface FileItem {
  name: string;
  type: "folder" | "video" | "image" | "pdf" | "zip";
  size?: string;
  date?: string;
  items?: number;
}

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
    { name: "interview-nicole-01.mp4", type: "video", size: "2.1 GB", date: "Apr 5" },
    { name: "interview-nicole-02.mp4", type: "video", size: "1.8 GB", date: "Apr 5" },
    { name: "b-roll-warehouse.mp4", type: "video", size: "3.4 GB", date: "Apr 4" },
    { name: "b-roll-dock-morning.mp4", type: "video", size: "2.7 GB", date: "Apr 4" },
    { name: "aerial-harbor-01.mp4", type: "video", size: "4.1 GB", date: "Apr 3" },
    { name: "aerial-harbor-02.mp4", type: "video", size: "3.8 GB", date: "Apr 3" },
    { name: "processing-floor.mp4", type: "video", size: "2.2 GB", date: "Apr 3" },
    { name: "crew-prep-deck.mp4", type: "video", size: "1.5 GB", date: "Apr 2" },
  ],
  "/Spring Campaign/Drafts": [
    { name: "spring-campaign-v3.mp4", type: "video", size: "890 MB", date: "Apr 14" },
    { name: "spring-campaign-v2.mp4", type: "video", size: "860 MB", date: "Apr 10" },
    { name: "spring-campaign-v1.mp4", type: "video", size: "920 MB", date: "Apr 5" },
  ],
  "/Spring Campaign/Final Deliverables": [
    { name: "spring-campaign-FINAL-16x9.mp4", type: "video", size: "1.2 GB", date: "—" },
    { name: "spring-campaign-FINAL-9x16.mp4", type: "video", size: "980 MB", date: "—" },
  ],
  "/Spring Campaign/Stills & Photos": [
    { name: "hero-shot-harbor.jpg", type: "image", size: "8.4 MB", date: "Apr 5" },
    { name: "crew-portrait-01.jpg", type: "image", size: "6.2 MB", date: "Apr 5" },
    { name: "product-close-up.jpg", type: "image", size: "5.8 MB", date: "Apr 4" },
    { name: "aerial-fleet.jpg", type: "image", size: "12.1 MB", date: "Apr 3" },
    { name: "nicole-interview-still.jpg", type: "image", size: "4.6 MB", date: "Apr 5" },
    { name: "dock-sunset.jpg", type: "image", size: "9.2 MB", date: "Apr 3" },
    { name: "processing-detail.jpg", type: "image", size: "5.1 MB", date: "Apr 3" },
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
    { name: "product-teaser-v1.mp4", type: "video", size: "420 MB", date: "Apr 12" },
  ],
  "/Brand Assets": [
    { name: "NYP-logo-full-color.png", type: "image", size: "2.4 MB", date: "Mar 1" },
    { name: "NYP-logo-white.png", type: "image", size: "1.8 MB", date: "Mar 1" },
    { name: "NYP-brand-colors.pdf", type: "pdf", size: "320 KB", date: "Mar 1" },
    { name: "NYP-brand-fonts.zip", type: "zip", size: "8.6 MB", date: "Mar 1" },
    { name: "NYP-brand-guidelines.pdf", type: "pdf", size: "6.2 MB", date: "Mar 1" },
    { name: "NYP-icon-set.zip", type: "zip", size: "3.4 MB", date: "Mar 1" },
  ],
};

function getIcon(type: string) {
  if (type === "folder") return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,200,100,0.6)" stroke="none">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
  if (type === "video") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(120,180,255,0.6)" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
  if (type === "image") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(160,220,120,0.6)" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
  if (type === "pdf") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,120,120,0.6)" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,160,255,0.6)" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ClientAssets() {
  const [currentPath, setCurrentPath] = useState("/");

  const currentFiles = folderStructure[currentPath] || [];
  const breadcrumbs = currentPath === "/" ? ["Files"] : ["Files", ...currentPath.slice(1).split("/")];

  const navigateTo = (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath(currentPath === "/" ? `/${item.name}` : `${currentPath}/${item.name}`);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setCurrentPath("/");
    } else {
      const parts = currentPath.slice(1).split("/");
      setCurrentPath("/" + parts.slice(0, index).join("/"));
    }
  };

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: "#ffffff" }}>
            Assets
          </h1>
          <button
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              color: "#000000",
              background: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {i > 0 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  fontSize: "13px",
                  color: i === breadcrumbs.length - 1 ? "#ffffff" : "rgba(255,255,255,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 2px",
                }}
              >
                {crumb}
              </button>
            </div>
          ))}
        </div>

        {currentPath === "/" && (
          <div
            style={{
              border: "2px dashed rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "36px",
              textAlign: "center",
              marginBottom: "32px",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" style={{ margin: "0 auto 12px" }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
              Drop files here or click to upload
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: currentFiles.some(f => f.type === "folder") ? "repeat(auto-fill, minmax(200px, 1fr))" : "1fr", gap: currentFiles.some(f => f.type === "folder") ? "12px" : "0" }}>
          {currentFiles.some(f => f.type === "folder") ? (
            currentFiles.map((item, i) => (
              <div
                key={i}
                onClick={() => navigateTo(item)}
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: item.type === "folder" ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                {getIcon(item.type)}
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff", marginBottom: "4px" }}>
                    {item.name}
                  </p>
                  {item.items !== undefined && (
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                      {item.items} items
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 40px", padding: "0 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Name", "Size", "Date", ""].map((h) => (
                  <p key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>
                    {h}
                  </p>
                ))}
              </div>
              {currentFiles.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 40px",
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {getIcon(item.type)}
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ffffff" }}>
                      {item.name}
                    </p>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                    {item.size}
                  </p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                    {item.date}
                  </p>
                  <div style={{ textAlign: "right" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
