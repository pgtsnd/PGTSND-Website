import { useState } from "react";
import { Link, useRoute } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface ProjectData {
  id: number;
  name: string;
  client: string;
  clientCompany: string;
  status: "active" | "paused" | "completed";
  phase: string;
  progress: number;
  startDate: string;
  dueDate: string;
  team: { name: string; role: string; initials: string }[];
  recentMessages: { from: string; text: string; time: string }[];
  documents: { key: string; label: string; status: "draft" | "final" | "empty" }[];
  reviewQueue: { title: string; version: string; status: "pending" | "approved" | "changes_requested"; sentAt: string }[];
}

const projectsData: Record<string, ProjectData> = {
  "1": {
    id: 1, name: "Spring Campaign Film", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Post-Production", progress: 55, startDate: "Mar 1, 2025", dueDate: "May 15, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Marcus Cole", role: "Cinematographer", initials: "MC" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
      { name: "Kandice M.", role: "Project Manager", initials: "KM" },
    ],
    recentMessages: [
      { from: "Nicole Baker", text: "Let me know when you've reviewed the latest cut — I have some thoughts on the interview section", time: "2 hours ago" },
      { from: "Jamie Lin", text: "Rough Cut v2 exported and sent to review. Sound design 80% complete.", time: "12 min ago" },
      { from: "Alex Torres", text: "Started color pass on scenes 1-3. Leaning cooler on shadows per Nicole's notes.", time: "Yesterday" },
    ],
    documents: [
      { key: "treatment", label: "Treatment / Creative Brief", status: "final" },
      { key: "storyboard", label: "Storyboard", status: "final" },
      { key: "shotlist", label: "Shot List", status: "final" },
      { key: "notes", label: "Client Notes", status: "draft" },
    ],
    reviewQueue: [
      { title: "Rough Cut v2", version: "v2", status: "pending", sentAt: "2 hours ago" },
      { title: "Rough Cut v1", version: "v1", status: "changes_requested", sentAt: "5 days ago" },
    ],
  },
  "2": {
    id: 2, name: "Product Launch Teaser", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Production", progress: 30, startDate: "Apr 1, 2025", dueDate: "Jun 2, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Sam Reeves", role: "Cinematographer", initials: "SR" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
    ],
    recentMessages: [
      { from: "Sam Reeves", text: "Lighting test done — looks great. Ready for product macro session tomorrow.", time: "3 hours ago" },
      { from: "Nicole Baker", text: "Can we add water droplets on the product? Like it just came from the ocean.", time: "Yesterday" },
    ],
    documents: [
      { key: "treatment", label: "Treatment / Creative Brief", status: "final" },
      { key: "storyboard", label: "Storyboard", status: "final" },
      { key: "shotlist", label: "Shot List", status: "draft" },
      { key: "notes", label: "Client Notes", status: "draft" },
    ],
    reviewQueue: [],
  },
};

export default function TeamProjectDetail() {
  const { t } = useTheme();
  const [, params] = useRoute("/team/projects/:id");
  const project = projectsData[params?.id || "1"];
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "assets" | "review">("overview");

  if (!project) return (
    <TeamLayout>
      <div style={{ padding: "40px 48px" }}>
        <Link href="/team/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" }}>← Back to Projects</Link>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginTop: "24px" }}>Project not found.</p>
      </div>
    </TeamLayout>
  );

  const docIcon = (status: string) => {
    if (status === "final") return <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.text }} />;
    if (status === "draft") return <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: `1.5px solid ${t.textTertiary}` }} />;
    return <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: `1.5px dashed ${t.textMuted}` }} />;
  };

  const reviewStatusStyle = (status: string) => {
    if (status === "pending") return { label: "Pending Review", color: "rgba(255,200,60,0.8)", bg: "rgba(255,200,60,0.08)" };
    if (status === "approved") return { label: "Approved", color: t.textTertiary, bg: t.hoverBg };
    return { label: "Changes Requested", color: t.textSecondary, bg: t.hoverBg };
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <Link href="/team/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          All Projects
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>{project.name}</h1>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: t.text, background: t.activeNav, padding: "4px 12px", borderRadius: "4px" }}>{project.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.textTertiary }}>{project.clientCompany}</span>
              <span style={{ color: t.textMuted }}>·</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>{project.client}</span>
              <span style={{ color: t.textMuted }}>·</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>{project.startDate} → {project.dueDate}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" }}>
              Message Client
            </button>
            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" }}>
              Edit Project
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "32px", borderBottom: `1px solid ${t.border}`, paddingBottom: "0" }}>
          {(["overview", "schedule", "assets", "review"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: activeTab === tab ? 600 : 400, fontSize: "13px",
              color: activeTab === tab ? t.text : t.textTertiary,
              background: "transparent", border: "none", borderBottom: activeTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
              padding: "12px 20px", cursor: "pointer", textTransform: "capitalize",
            }}>
              {tab === "review" ? "Client Review" : tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px" }}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "28px" }}>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "18px 22px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>{project.progress}%</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Overall Progress</p>
                </div>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "18px 22px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>{project.phase}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Current Phase</p>
                </div>
                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "18px 22px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>{project.dueDate.split(",")[0]}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>Due Date</p>
                </div>
              </div>

              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "14px" }}>Project Documents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
                {project.documents.map((doc) => (
                  <div key={doc.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {docIcon(doc.status)}
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.text }}>{doc.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: doc.status === "final" ? t.textTertiary : t.textMuted, background: t.hoverBg, padding: "3px 10px", borderRadius: "3px" }}>{doc.status}</span>
                      <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "5px", padding: "5px 12px", cursor: "pointer" }}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "14px" }}>Client Review Queue</h3>
              {project.reviewQueue.length === 0 ? (
                <div style={{ padding: "20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>No items in review</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
                  {project.reviewQueue.map((item, i) => {
                    const rs = reviewStatusStyle(item.status);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
                        <div>
                          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "2px" }}>{item.title}</p>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>Sent {item.sentAt}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: rs.color, background: rs.bg, padding: "4px 12px", borderRadius: "4px" }}>{rs.label}</span>
                          {item.status === "pending" && (
                            <button style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "5px", padding: "5px 12px", cursor: "pointer" }}>
                              Remind
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "14px" }}>Quick Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Upload Assets", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> },
                  { label: "Send to Review", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> },
                  { label: "Update Schedule", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                  { label: "Generate Invoice", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
                ].map((action) => (
                  <button key={action.label} style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px",
                    background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", cursor: "pointer",
                    fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary,
                  }}>
                    <span style={{ color: t.textMuted, display: "flex" }}>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "14px" }}>Team</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
                {project.team.map((member) => (
                  <div key={member.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "8px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: t.activeNav, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: t.textTertiary }}>{member.initials}</div>
                    <div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>{member.name}</p>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "14px" }}>Recent Messages</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {project.recentMessages.map((msg, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.text }}>{msg.from}</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: t.textMuted }}>{msg.time}</span>
                    </div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textSecondary, lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", marginTop: "10px", fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "10px", cursor: "pointer" }}>
                Open Thread →
              </button>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div style={{ padding: "40px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1" style={{ marginBottom: "16px" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "8px" }}>Schedule Editor</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>Drag tasks, adjust timelines, and reassign crew members. The client sees schedule changes in real time on their project view.</p>
          </div>
        )}

        {activeTab === "assets" && (
          <div style={{ padding: "40px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1" style={{ marginBottom: "16px" }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "8px" }}>Asset Manager</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>Upload raw footage, organize into folders, tag assets, and choose what's visible to the client. Drag files to set up the client's asset library.</p>
          </div>
        )}

        {activeTab === "review" && (
          <div style={{ padding: "40px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1" style={{ marginBottom: "16px" }}>
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "8px" }}>Review Manager</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>Export cuts to the client review portal, track feedback, manage revision rounds, and approve final deliverables. See all client comments with timestamps inline.</p>
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
