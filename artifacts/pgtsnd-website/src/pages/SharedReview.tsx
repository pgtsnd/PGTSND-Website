import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { useTheme } from "../components/ThemeContext";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import type { VideoComment } from "../components/VideoReviewPanel";
import { api, type PublicReviewData, type VideoCommentWithReplies } from "../lib/api";

export default function SharedReview() {
  const { t } = useTheme();
  const [, params] = useRoute("/review/:token");
  const token = params?.token || "";
  const [data, setData] = useState<PublicReviewData | null>(null);
  const [comments, setComments] = useState<VideoCommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getPublicReview(token)
      .then((result) => {
        setData(result);
        setComments(result.comments);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Review not found"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleAddComment = useCallback(
    async (timestampSeconds: number, content: string) => {
      const comment = await api.addPublicComment(
        token,
        timestampSeconds,
        content,
        authorName,
      );
      setComments((prev) =>
        [...prev, comment].sort(
          (a, b) => a.timestampSeconds - b.timestampSeconds,
        ),
      );
      setActiveTimestamp(null);
    },
    [token, authorName],
  );

  const handleAddReply = useCallback(
    async (commentId: string, content: string) => {
      const reply = await api.addPublicCommentReply(
        token,
        commentId,
        content,
        authorName,
      );
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c,
        ),
      );
    },
    [token, authorName],
  );

  const handleCommentClick = useCallback((comment: VideoComment) => {
    setSeekTo(comment.timestampSeconds);
    setTimeout(() => setSeekTo(null), 100);
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      const comment = comments.find((c) => c.id === id);
      if (comment) handleCommentClick(comment);
    },
    [comments, handleCommentClick],
  );

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: "Draft",
      pending: "Pending",
      in_review: "In Review",
      approved: "Approved",
      revision_requested: "Changes Requested",
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "rgba(96,208,96,0.8)";
    if (s === "in_review" || s === "pending") return "rgba(255,200,60,0.9)";
    if (s === "revision_requested") return "rgba(255,140,60,0.8)";
    return t.textMuted;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: t.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            color: t.textMuted,
          }}
        >
          Loading review...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: t.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={t.textMuted}
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: "16px",
            color: t.text,
          }}
        >
          {error || "Review not found"}
        </p>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 400,
            fontSize: "13px",
            color: t.textMuted,
          }}
        >
          This review link may have expired or been removed.
        </p>
      </div>
    );
  }

  const deliverable = data.deliverable;

  return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <div
        style={{
          padding: "20px 48px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "11px",
              color: t.textMuted,
              marginBottom: "2px",
            }}
          >
            {deliverable.projectName} · Shared Review
          </p>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: "20px",
              color: t.text,
            }}
          >
            {deliverable.title}
          </h1>
        </div>
        <span
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: statusColor(deliverable.status),
            background: `${statusColor(deliverable.status)}12`,
            padding: "4px 12px",
            borderRadius: "4px",
          }}
        >
          {statusLabel(deliverable.status)}
        </span>
      </div>

      <div
        style={{
          padding: "24px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "24px",
          maxWidth: "1400px",
        }}
      >
        <div>
          {deliverable.fileUrl ? (
            <VideoPlayer
              src={
                deliverable.fileUrl.startsWith("/api/storage/objects/")
                  ? `${deliverable.fileUrl}?reviewToken=${encodeURIComponent(token)}`
                  : deliverable.fileUrl
              }
              markers={comments.map((c) => ({
                id: c.id,
                timestampSeconds: c.timestampSeconds,
              }))}
              onTimeClick={(seconds) => setActiveTimestamp(seconds)}
              onMarkerClick={handleMarkerClick}
              seekTo={seekTo}
            />
          ) : (
            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: "10px",
                padding: "80px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  color: t.textMuted,
                }}
              >
                No video file available
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: t.textMuted,
                }}
              >
                Version:
              </span>
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                  fontSize: "11px",
                  color: t.textSecondary,
                }}
              >
                {deliverable.version || "v1"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: t.textMuted,
                }}
              >
                Type:
              </span>
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                  fontSize: "11px",
                  color: t.textSecondary,
                }}
              >
                {deliverable.type}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "20px",
            maxHeight: "calc(100vh - 160px)",
            overflowY: "auto",
          }}
        >
          <VideoReviewPanel
            comments={comments}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onCommentClick={handleCommentClick}
            activeTimestamp={activeTimestamp}
            isPublic={true}
            publicAuthorName={authorName}
            onPublicAuthorNameChange={setAuthorName}
          />
        </div>
      </div>
    </div>
  );
}
