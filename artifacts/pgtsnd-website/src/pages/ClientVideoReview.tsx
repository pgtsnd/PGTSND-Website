import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

const revisions = [
  { id: 1, label: "v3 — Current", date: "Apr 14, 2025", status: "In Review" },
  { id: 2, label: "v2", date: "Apr 10, 2025", status: "Changes Requested" },
  { id: 3, label: "v1", date: "Apr 5, 2025", status: "Changes Requested" },
];

const comments = [
  {
    author: "Nicole Baker",
    initials: "NB",
    time: "2:34",
    text: "Love this transition — can we extend it by about half a second?",
    timestamp: "2 hours ago",
    replies: [
      {
        author: "Bri Dwyer",
        initials: "BD",
        text: "Absolutely, I'll stretch it out in the next cut.",
        timestamp: "1 hour ago",
      },
    ],
  },
  {
    author: "Nicole Baker",
    initials: "NB",
    time: "1:12",
    text: "The color grading here feels a bit cool — can we warm it up to match the opening shot?",
    timestamp: "3 hours ago",
    replies: [],
  },
  {
    author: "Nicole Baker",
    initials: "NB",
    time: "0:45",
    text: "This opening is incredible. Perfect energy.",
    timestamp: "3 hours ago",
    replies: [
      {
        author: "Bri Dwyer",
        initials: "BD",
        text: "Thank you! Marcus nailed that shot on the first take.",
        timestamp: "2 hours ago",
      },
    ],
  },
];

export default function ClientVideoReview() {
  const [activeRevision, setActiveRevision] = useState(revisions[0]);
  const [newComment, setNewComment] = useState("");

  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "28px",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: "4px",
              }}
            >
              Video Review
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Spring Campaign Film
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#ffffff",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "6px",
                padding: "10px 24px",
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
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#000000",
                background: "#60d060",
                border: "none",
                borderRadius: "6px",
                padding: "10px 24px",
                cursor: "pointer",
              }}
            >
              Approve Draft
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "40px" }}>
          <div>
            <div
              style={{
                aspectRatio: "16/9",
                background: "#0a0a0a",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  height: "4px",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ width: "35%", height: "100%", background: "#ffffff" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
              {revisions.map((rev) => (
                <button
                  key={rev.id}
                  onClick={() => setActiveRevision(rev)}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: activeRevision.id === rev.id ? 600 : 400,
                    fontSize: "12px",
                    color: activeRevision.id === rev.id ? "#ffffff" : "rgba(255,255,255,0.4)",
                    background: activeRevision.id === rev.id ? "rgba(255,255,255,0.08)" : "transparent",
                    border: "1px solid",
                    borderColor: activeRevision.id === rev.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {rev.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
              }}
            >
              <div>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: "#ffffff" }}>
                  {activeRevision.label}
                </p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                  Uploaded {activeRevision.date}
                </p>
              </div>
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: activeRevision.status === "In Review" ? "#f0c040" : "rgba(255,255,255,0.4)",
                  background: activeRevision.status === "In Review" ? "rgba(240,192,64,0.1)" : "rgba(255,255,255,0.05)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                }}
              >
                {activeRevision.status}
              </span>
            </div>
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              Comments
            </h2>

            <div style={{ marginBottom: "24px" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (use @timestamp to reference a moment)"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  color: "#ffffff",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  width: "100%",
                  minHeight: "80px",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#000000",
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 20px",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Post Comment
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {comments.map((comment, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 700,
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.6)",
                        flexShrink: 0,
                      }}
                    >
                      {comment.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: "#ffffff" }}>
                          {comment.author}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Montserrat', monospace",
                            fontWeight: 600,
                            fontSize: "10px",
                            color: "#f0c040",
                            background: "rgba(240,192,64,0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          @{comment.time}
                        </span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
                          {comment.timestamp}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                        {comment.text}
                      </p>

                      {comment.replies.map((reply, j) => (
                        <div
                          key={j}
                          style={{
                            marginTop: "12px",
                            paddingLeft: "16px",
                            borderLeft: "2px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <div
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "'Montserrat', sans-serif",
                                fontWeight: 700,
                                fontSize: "8px",
                                color: "rgba(255,255,255,0.5)",
                              }}
                            >
                              {reply.initials}
                            </div>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                              {reply.author}
                            </span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
                              {reply.timestamp}
                            </span>
                          </div>
                          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
