import { useState, useRef } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface AssetFolder {
  name: string;
  project: string;
  fileCount: number;
  size: string;
  lastModified: string;
  type: "footage" | "exports" | "audio" | "graphics" | "photos";
}

const folders: AssetFolder[] = [
  { name: "Raw Footage — Day 1", project: "Spring Campaign Film", fileCount: 24, size: "6.2 GB", lastModified: "Apr 10", type: "footage" },
  { name: "Raw Footage — Day 2", project: "Spring Campaign Film", fileCount: 18, size: "4.8 GB", lastModified: "Apr 12", type: "footage" },
  { name: "Raw Footage — Day 3", project: "Spring Campaign Film", fileCount: 47, size: "12.3 GB", lastModified: "Apr 14", type: "footage" },
  { name: "Exports", project: "Spring Campaign Film", fileCount: 3, size: "1.8 GB", lastModified: "2h ago", type: "exports" },
  { name: "Sound Design", project: "Spring Campaign Film", fileCount: 12, size: "340 MB", lastModified: "Yesterday", type: "audio" },
  { name: "Color Grades", project: "Spring Campaign Film", fileCount: 6, size: "890 MB", lastModified: "Yesterday", type: "graphics" },
  { name: "BTS Photos", project: "Spring Campaign Film", fileCount: 24, size: "180 MB", lastModified: "Apr 12", type: "photos" },
  { name: "Lighting Tests", project: "Product Launch Teaser", fileCount: 8, size: "2.1 GB", lastModified: "3h ago", type: "footage" },
  { name: "Product Macro Shots", project: "Product Launch Teaser", fileCount: 12, size: "3.4 GB", lastModified: "Today", type: "footage" },
  { name: "Client Deliverables", project: "Spring Campaign Film", fileCount: 2, size: "2.1 GB", lastModified: "Apr 8", type: "exports" },
];

const recentFiles = [
  { name: "Rough_Cut_v2.mp4", project: "Spring Campaign Film", size: "820 MB", time: "12m ago", type: "video" },
  { name: "Day3_Clip_047.mov", project: "Spring Campaign Film", size: "1.2 GB", time: "1h ago", type: "video" },
  { name: "lighting_test_macro_01.mp4", project: "Product Launch Teaser", size: "340 MB", time: "3h ago", type: "video" },
  { name: "scene1-3_color_v2.dpx", project: "Spring Campaign Film", size: "890 MB", time: "Yesterday", type: "color" },
  { name: "interview_sfx_bed.wav", project: "Spring Campaign Film", size: "24 MB", time: "Yesterday", type: "audio" },
];

export default function TeamAssets() {
  const { t } = useTheme();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const projectNames = [...new Set(folders.map((f) => f.project))];
  const filteredFolders = projectFilter === "all" ? folders : folders.filter((f) => f.project === projectFilter);

  const totalSize = "32.4 GB";
  const totalFiles = folders.reduce((a, f) => a + f.fileCount, 0);

  const typeIcon = (type: string) => {
    const s = { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: t.textMuted, strokeWidth: "1.5" };
    if (type === "footage" || type === "video") return <svg {...s}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>;
    if (type === "exports") return <svg {...s}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
    if (type === "audio") return <svg {...s}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
    if (type === "graphics" || type === "color") return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    if (type === "photos") return <svg {...s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    return <svg {...s}><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>;
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Asset Library</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{totalFiles} files · {totalSize} total</p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Upload
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          <button onClick={() => setProjectFilter("all")} style={f({
            fontWeight: projectFilter === "all" ? 600 : 400, fontSize: "12px",
            color: projectFilter === "all" ? t.text : t.textMuted,
            background: projectFilter === "all" ? t.activeNav : "transparent",
            border: `1px solid ${projectFilter === "all" ? t.border : "transparent"}`,
            borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
          })}>All Projects</button>
          {projectNames.map((p) => (
            <button key={p} onClick={() => setProjectFilter(p)} style={f({
              fontWeight: projectFilter === p ? 600 : 400, fontSize: "12px",
              color: projectFilter === p ? t.text : t.textMuted,
              background: projectFilter === p ? t.activeNav : "transparent",
              border: `1px solid ${projectFilter === p ? t.border : "transparent"}`,
              borderRadius: "6px", padding: "8px 14px", cursor: "pointer",
            })}>{p}</button>
          ))}
        </div>

        <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>Folders</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "36px" }}>
          {filteredFolders.map((folder) => (
            <button key={folder.name} type="button" style={{
              background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
              padding: "18px", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                {typeIcon(folder.type)}
                <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>{folder.name}</p>
              </div>
              <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "4px" })}>{folder.project}</p>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{folder.fileCount} files</span>
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{folder.size}</span>
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{folder.lastModified}</span>
              </div>
            </button>
          ))}
        </div>

        <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>Recent Files</h2>
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
          {recentFiles.map((file, i) => (
            <div key={file.name} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "12px 20px",
              borderBottom: i < recentFiles.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
            }}>
              <div style={{ display: "flex" }}>{typeIcon(file.type)}</div>
              <div style={{ flex: 1 }}>
                <p style={f({ fontWeight: 500, fontSize: "13px", color: t.text })}>{file.name}</p>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{file.project}</p>
              </div>
              <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{file.size}</span>
              <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, minWidth: "70px", textAlign: "right" })}>{file.time}</span>
              <button type="button" aria-label={`Download ${file.name}`} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </TeamLayout>
  );
}
