import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

const revisions = [
  { id: 1, label: "v3 — Current", date: "Apr 14, 2025", status: "In Review", duration: 180 },
  { id: 2, label: "v2", date: "Apr 10, 2025", status: "Changes Requested", duration: 175 },
  { id: 3, label: "v1", date: "Apr 5, 2025", status: "Changes Requested", duration: 168 },
];

const comments = [
  {
    author: "Nicole Baker",
    initials: "NB",
    timeSeconds: 45,
    timeLabel: "0:45",
    text: "This opening is incredible. Perfect energy. Love the fog and the sound design.",
    timestamp: "3 hours ago",
    color: "#60d060",
    replies: [
      { author: "Bri Dwyer", initials: "BD", text: "Thank you! Marcus nailed that shot on the first take. The fog was a gift from the weather gods.", timestamp: "2 hours ago" },
    ],
  },
  {
    author: "Nicole Baker",
    initials: "NB",
    timeSeconds: 72,
    timeLabel: "1:12",
    text: "The color grading here feels a bit cool — can we warm it up to match the opening shot? I want that golden-hour feel to carry through.",
    timestamp: "3 hours ago",
    color: "#f0c040",
    replies: [],
  },
  {
    author: "Nicole Baker",
    initials: "NB",
    timeSeconds: 102,
    timeLabel: "1:42",
    text: "Great b-roll of the processing floor. Can we add a brief text overlay here with our sustainability stats? '100% wild-caught, zero waste processing.'",
    timestamp: "2 hours ago",
    color: "#78b4ff",
    replies: [
      { author: "Jamie Lin", initials: "JL", text: "On it — I'll mock up a lower-third with your brand font. Should have it in the next cut.", timestamp: "1 hour ago" },
    ],
  },
  {
    author: "Nicole Baker",
    initials: "NB",
    timeSeconds: 154,
    timeLabel: "2:34",
    text: "Love this transition — can we extend it by about half a second? The cut feels a little abrupt right now.",
    timestamp: "2 hours ago",
    color: "#c090ff",
    replies: [
      { author: "Bri Dwyer", initials: "BD", text: "Absolutely, I'll stretch it out in the next cut. Good eye.", timestamp: "1 hour ago" },
    ],
  },
];

export default function ClientVideoReview() {
  const [activeRevision, setActiveRevision] = useState(revisions[0]);
  const [newComment, setNewComment] = useState("");
  const [playheadPosition] = useState(35);
  const [selectedComment, setSelectedComment] = useState<number | null>(null);

  const totalDuration = activeRevision.duration;

  return (
    <ClientLayout>
      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>
              Spring Campaign Film
            </p>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: "#ffffff" }}>
              Video Review
            </h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                color: "#ffffff",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Request Changes
            </button>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                color: "#000000",
                background: "#60d060",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Approve This Draft
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px" }}>
          <div>
            <div
              style={{
                aspectRatio: "16/9",
                background: "#0a0a0a",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                marginBottom: "0",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "'Montserrat', monospace", fontWeight: 500, fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                    1:03
                  </span>
                  <span style={{ fontFamily: "'Montserrat', monospace", fontWeight: 500, fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                    3:00
                  </span>
                </div>

                <div style={{ position: "relative", height: "18px", cursor: "pointer" }}>
                  <div style={{ position: "absolute", top: "7px", left: "0", right: "0", height: "4px", background: "rgba(255,255,255,0.12)", borderRadius: "2px" }}>
                    <div style={{ width: `${playheadPosition}%`, height: "100%", background: "#ffffff", borderRadius: "2px" }} />
                  </div>

                  {comments.map((comment, i) => {
                    const pos = (comment.timeSeconds / totalDuration) * 100;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedComment(selectedComment === i ? null : i)}
                        style={{
                          position: "absolute",
                          left: `${pos}%`,
                          top: "1px",
                          transform: "translateX(-50%)",
                          width: selectedComment === i ? "14px" : "10px",
                          height: selectedComment === i ? "14px" : "10px",
                          borderRadius: "50%",
                          background: comment.color,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          border: selectedComment === i ? "2px solid #ffffff" : "2px solid transparent",
                          zIndex: selectedComment === i ? 5 : 2,
                          boxShadow: `0 0 8px ${comment.color}40`,
                        }}
                        title={`${comment.timeLabel} — ${comment.author}`}
                      />
                    );
                  })}

                  <div
                    style={{
                      position: "absolute",
                      left: `${playheadPosition}%`,
                      top: "2px",
                      transform: "translateX(-50%)",
                      width: "3px",
                      height: "14px",
                      background: "#ffffff",
                      borderRadius: "2px",
                      zIndex: 3,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px", marginBottom: "16px" }}>
              {revisions.map((rev) => (
                <button
                  key={rev.id}
                  onClick={() => setActiveRevision(rev)}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: activeRevision.id === rev.id ? 600 : 400,
                    fontSize: "12px",
                    color: activeRevision.id === rev.id ? "#ffffff" : "rgba(255,255,255,0.35)",
                    background: activeRevision.id === rev.id ? "rgba(255,255,255,0.06)" : "transparent",
                    border: "1px solid",
                    borderColor: activeRevision.id === rev.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  {rev.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", alignItems: "center" }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                Uploaded {activeRevision.date}
              </span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: activeRevision.status === "In Review" ? "rgba(255,200,60,0.9)" : "rgba(255,255,255,0.35)",
                  background: activeRevision.status === "In Review" ? "rgba(255,200,60,0.08)" : "rgba(255,255,255,0.03)",
                  padding: "3px 10px",
                  borderRadius: "4px",
                }}
              >
                {activeRevision.status}
              </span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                {comments.length} comments
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>
                Comments
              </h2>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                Click dots on timeline to jump
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment at the current timestamp..."
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  color: "#ffffff",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  width: "100%",
                  minHeight: "60px",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                  Commenting at 1:03
                </span>
                <button
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#000000",
                    background: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 16px",
                    cursor: "pointer",
                  }}
                >
                  Post
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {comments.map((comment, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: selectedComment === i ? "rgba(255,255,255,0.02)" : "transparent",
                    borderRadius: selectedComment === i ? "6px" : "0",
                    paddingLeft: selectedComment === i ? "10px" : "0",
                    paddingRight: selectedComment === i ? "10px" : "0",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedComment(i)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: comment.color, flexShrink: 0 }} />
                    <button
                      style={{
                        fontFamily: "'Montserrat', monospace",
                        fontWeight: 600,
                        fontSize: "11px",
                        color: comment.color,
                        background: `${comment.color}12`,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {comment.timeLabel}
                    </button>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: "#ffffff" }}>
                      {comment.author}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
                      {comment.timestamp}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginLeft: "16px" }}>
                    {comment.text}
                  </p>
                  {comment.replies.map((reply, j) => (
                    <div key={j} style={{ marginTop: "10px", marginLeft: "16px", paddingLeft: "14px", borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "7px", color: "rgba(255,255,255,0.4)" }}>
                          {reply.initials}
                        </div>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                          {reply.author}
                        </span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>
                          {reply.timestamp}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                        {reply.text}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
