import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

const categories = ["All", "Client Uploads", "Raw Footage", "Drafts", "Final Deliverables"];

const mockAssets = [
  { name: "brand-guidelines-v2.pdf", category: "Client Uploads", size: "4.2 MB", date: "Apr 10, 2025", type: "pdf" },
  { name: "logo-package.zip", category: "Client Uploads", size: "12.8 MB", date: "Apr 8, 2025", type: "zip" },
  { name: "interview-raw-01.mp4", category: "Raw Footage", size: "2.1 GB", date: "Apr 5, 2025", type: "video" },
  { name: "interview-raw-02.mp4", category: "Raw Footage", size: "1.8 GB", date: "Apr 5, 2025", type: "video" },
  { name: "b-roll-warehouse.mp4", category: "Raw Footage", size: "3.4 GB", date: "Apr 4, 2025", type: "video" },
  { name: "spring-campaign-v3.mp4", category: "Drafts", size: "890 MB", date: "Apr 14, 2025", type: "video" },
  { name: "spring-campaign-v2.mp4", category: "Drafts", size: "860 MB", date: "Apr 10, 2025", type: "video" },
  { name: "product-teaser-v1.mp4", category: "Drafts", size: "420 MB", date: "Apr 12, 2025", type: "video" },
  { name: "winter-recap-final.mp4", category: "Final Deliverables", size: "1.2 GB", date: "Mar 28, 2025", type: "video" },
  { name: "winter-recap-final.mov", category: "Final Deliverables", size: "4.8 GB", date: "Mar 28, 2025", type: "video" },
];

function getFileIcon(type: string) {
  if (type === "video") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export default function ClientAssets() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredAssets =
    activeCategory === "All" ? mockAssets : mockAssets.filter((a) => a.category === activeCategory);

  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "28px",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Assets
          </h1>
          <button
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#000000",
              background: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Files
          </button>
        </div>

        <div
          style={{
            border: "2px dashed rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
            marginBottom: "48px",
            cursor: "pointer",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            style={{ margin: "0 auto 16px" }}
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "4px",
            }}
          >
            Drag and drop files here
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            or click to browse — up to 10GB per file
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "32px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: activeCategory === cat ? 600 : 400,
                fontSize: "12px",
                color: activeCategory === cat ? "#ffffff" : "rgba(255,255,255,0.45)",
                background: activeCategory === cat ? "rgba(255,255,255,0.08)" : "transparent",
                border: "1px solid",
                borderColor: activeCategory === cat ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "7px 18px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 100px 120px 60px",
              padding: "0 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {["File Name", "Category", "Size", "Date", ""].map((h) => (
              <p
                key={h}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {h}
              </p>
            ))}
          </div>
          {filteredAssets.map((asset, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 100px 120px 60px",
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "flex" }}>{getFileIcon(asset.type)}</span>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                    color: "#ffffff",
                  }}
                >
                  {asset.name}
                </p>
              </div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                {asset.category}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                {asset.size}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                {asset.date}
              </p>
              <div style={{ textAlign: "right" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
