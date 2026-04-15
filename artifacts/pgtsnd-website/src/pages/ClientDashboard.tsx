import { Link } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

const pendingReviews = [
  {
    title: "Spring Campaign Film — v3",
    type: "Video Draft",
    submitted: "2 hours ago",
    reminder: null,
    project: "Spring Campaign",
  },
  {
    title: "Social Media Graphics — Batch 2",
    type: "Graphics",
    submitted: "1 day ago",
    reminder: "Reminder sent",
    project: "Spring Campaign",
  },
  {
    title: "Blog Post — Behind the Scenes",
    type: "Blog Post",
    submitted: "3 days ago",
    reminder: "2nd reminder sent",
    project: "Product Launch",
  },
];

const recentMessages = [
  { author: "Bri Dwyer", text: "Let me know when you've reviewed the latest cut", project: "Spring Campaign", time: "2 min ago", unread: true },
  { author: "Sam Reeves", text: "Macro lens reveal idea for the product launch", project: "Product Launch Teaser", time: "1 hour ago", unread: false },
  { author: "Kandice M.", text: "Rough cut targeting Friday — I'll send the review link", project: "Spring Campaign", time: "Yesterday", unread: false },
];

const projectStatus = [
  { name: "Spring Campaign Film", phase: "Post-Production", progress: 75, nextMilestone: "Review — May 2" },
  { name: "Product Launch Teaser", phase: "Production", progress: 40, nextMilestone: "Filming — Apr 28" },
];

export default function ClientDashboard() {
  const { t } = useTheme();

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginBottom: "4px" }}>
            Welcome back,
          </p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "28px", color: t.text }}>
            Nicole
          </h1>
        </div>

        <div
          style={{
            background: "rgba(255,200,60,0.04)",
            border: "1px solid rgba(255,200,60,0.12)",
            borderRadius: "10px",
            padding: "20px 24px",
            marginBottom: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,200,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,60,0.8)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "rgba(255,200,60,0.9)" }}>
                3 items need your review
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>
                Your team is waiting on your feedback to keep things moving
              </p>
            </div>
          </div>
          <Link
            href="/client-hub/review"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#000000",
              background: "rgba(255,200,60,0.9)",
              padding: "8px 20px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Review Now
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "36px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>
                Recent Messages
              </h2>
              <Link href="/client-hub/messages" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" }}>
                View All →
              </Link>
            </div>
            {recentMessages.map((msg, i) => (
              <Link key={i} href="/client-hub/messages" style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    background: msg.unread ? t.hoverBg : "transparent",
                    borderLeft: msg.unread ? `2px solid ${t.accent}` : "2px solid transparent",
                    marginBottom: "2px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: msg.unread ? 600 : 500, fontSize: "13px", color: t.text }}>
                      {msg.author}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      {msg.time}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.text}
                  </p>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                    {msg.project}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>
                Content to Review
              </h2>
            </div>
            {pendingReviews.map((review, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text }}>
                    {review.title}
                  </p>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: review.type === "Video Draft" ? "rgba(120,180,255,0.8)" : review.type === "Graphics" ? "rgba(200,140,255,0.8)" : "rgba(120,220,160,0.8)",
                      background: review.type === "Video Draft" ? "rgba(120,180,255,0.08)" : review.type === "Graphics" ? "rgba(200,140,255,0.08)" : "rgba(120,220,160,0.08)",
                      padding: "3px 10px",
                      borderRadius: "4px",
                      flexShrink: 0,
                      marginLeft: "8px",
                    }}
                  >
                    {review.type}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                    Submitted {review.submitted}
                  </span>
                  {review.reminder && (
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: "rgba(255,180,60,0.7)" }}>
                      {review.reminder}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>
            Active Projects
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {projectStatus.map((project) => (
              <Link key={project.name} href="/client-hub/projects" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    background: t.bgCard,
                    border: `1px solid ${t.border}`,
                    borderRadius: "10px",
                    padding: "20px 24px",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "15px", color: t.text }}>
                      {project.name}
                    </p>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>
                      {project.progress}%
                    </span>
                  </div>
                  <div style={{ height: "3px", background: t.border, borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", width: `${project.progress}%`, background: t.accent, borderRadius: "2px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>
                      {project.phase}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      Next: {project.nextMilestone}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
