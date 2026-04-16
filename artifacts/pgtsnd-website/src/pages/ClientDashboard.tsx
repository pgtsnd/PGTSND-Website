import { useState, useEffect } from "react";
import { Link } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type DashboardData, type Project, type PendingReview, type Message } from "../lib/api";

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function reminderLabel(count: number, lastDay: number | null) {
  if (count === 0 || !lastDay) return null;
  if (count === 1) return "Reminder sent";
  return `${count} reminders sent`;
}

export default function ClientDashboard() {
  const { t } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientDashboard()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: t.textTertiary }}>Loading...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error || !data) {
    return (
      <ClientLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: "rgba(255,100,100,0.8)" }}>
            {error || "Failed to load dashboard"}
          </p>
        </div>
      </ClientLayout>
    );
  }

  const { projects, pendingReviews, recentMessages } = data;
  const activeProjects = projects.filter((p) =>
    ["active", "in_progress", "review"].includes(p.status),
  );

  const phaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      pre_production: "Pre-Production",
      production: "Production",
      post_production: "Post-Production",
      review: "Review",
      delivered: "Delivered",
    };
    return labels[phase] || phase;
  };

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginBottom: "4px" }}>
            Welcome back,
          </p>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "28px", color: t.text }}>
            Dashboard
          </h1>
        </div>

        {pendingReviews.length > 0 && (
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
                  {pendingReviews.length} item{pendingReviews.length > 1 ? "s" : ""} need{pendingReviews.length === 1 ? "s" : ""} your review
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
        )}

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
            {recentMessages.length === 0 && (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted, padding: "16px 0" }}>
                No messages yet
              </p>
            )}
            {recentMessages.slice(0, 5).map((msg: Message) => (
              <Link key={msg.id} href="/client-hub/messages" style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    background: !msg.read ? t.hoverBg : "transparent",
                    borderLeft: !msg.read ? `2px solid ${t.accent}` : "2px solid transparent",
                    marginBottom: "2px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: !msg.read ? 600 : 500, fontSize: "13px", color: t.text }}>
                      {msg.senderName}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.content}
                  </p>
                  {msg.projectName && (
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.tagText, background: t.tagBg, padding: "2px 8px", borderRadius: "4px" }}>
                      {msg.projectName}
                    </span>
                  )}
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
            {pendingReviews.length === 0 && (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted, padding: "16px 0" }}>
                No pending reviews
              </p>
            )}
            {pendingReviews.map((review: PendingReview) => {
              const typeColor =
                review.type === "video"
                  ? "rgba(120,180,255,0.8)"
                  : review.type === "graphics"
                    ? "rgba(200,140,255,0.8)"
                    : "rgba(120,220,160,0.8)";
              const typeBg =
                review.type === "video"
                  ? "rgba(120,180,255,0.08)"
                  : review.type === "graphics"
                    ? "rgba(200,140,255,0.08)"
                    : "rgba(120,220,160,0.08)";
              const typeLabel =
                review.type === "video"
                  ? "Video Draft"
                  : review.type === "graphics"
                    ? "Graphics"
                    : review.type.charAt(0).toUpperCase() + review.type.slice(1);
              const reminder = reminderLabel(review.reminderCount, review.lastReminderDay);

              return (
                <Link key={review.id} href="/client-hub/review" style={{ textDecoration: "none", display: "block" }}>
                  <div
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
                          color: typeColor,
                          background: typeBg,
                          padding: "3px 10px",
                          borderRadius: "4px",
                          flexShrink: 0,
                          marginLeft: "8px",
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                        Submitted {review.submittedAt ? timeAgo(review.submittedAt) : "—"}
                      </span>
                      {reminder && (
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: "rgba(255,180,60,0.7)" }}>
                          {reminder}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>
            Active Projects
          </h2>
          {activeProjects.length === 0 && (
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>
              No active projects
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {activeProjects.map((project: Project) => (
              <Link key={project.id} href="/client-hub/projects" style={{ textDecoration: "none" }}>
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
                      {project.calculatedProgress}%
                    </span>
                  </div>
                  <div style={{ height: "3px", background: t.border, borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", width: `${project.calculatedProgress}%`, background: t.accent, borderRadius: "2px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>
                      {phaseLabel(project.phase)}
                    </span>
                    {project.dueDate && (
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>
                        Due: {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
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
