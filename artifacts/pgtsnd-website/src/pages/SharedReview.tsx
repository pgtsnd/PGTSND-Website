import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { useTheme } from "../components/ThemeContext";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import UploaderBadge from "../components/UploaderBadge";
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
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showAllVersionComments, setShowAllVersionComments] = useState(false);

  useEffect(() => {
    setShowAllVersionComments(false);
  }, [selectedVersionId]);

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
  const versions = data.versions ?? [];
  const activeVersion = selectedVersionId
    ? versions.find((v) => v.id === selectedVersionId) ?? null
    : null;
  const activeFileUrl = activeVersion?.fileUrl ?? deliverable.fileUrl;
  const activeVersionLabel = activeVersion?.version ?? deliverable.version ?? "v1";
  const isViewingPreviousCut = !!activeVersion && activeVersion.fileUrl !== deliverable.fileUrl;
  const versionLabelById: Record<string, string> = {};
  for (const v of versions) versionLabelById[v.id] = v.version;
  const visibleComments =
    isViewingPreviousCut && !showAllVersionComments && activeVersion
      ? comments.filter((c) => c.deliverableVersionId === activeVersion.id)
      : comments;
  const buildSrc = (url: string) =>
    url.startsWith("/api/storage/objects/")
      ? `${url}?reviewToken=${encodeURIComponent(token)}`
      : url;

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
          {versions.length > 0 && (
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <label
                htmlFor="shared-review-version-select"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Version
              </label>
              <select
                id="shared-review-version-select"
                data-testid="shared-review-version-select"
                value={selectedVersionId ?? ""}
                onChange={(e) => setSelectedVersionId(e.target.value || null)}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  color: t.text,
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Latest ({deliverable.version || "v1"})</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.version} ·{" "}
                    {new Date(v.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isViewingPreviousCut && (
            <div
              data-testid="shared-review-previous-version-banner"
              style={{
                marginBottom: "12px",
                padding: "10px 14px",
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  color: t.textSecondary,
                }}
              >
                Viewing previous cut {activeVersionLabel} (latest is{" "}
                {deliverable.version || "v1"})
                {" · "}
                {showAllVersionComments
                  ? "showing comments from all versions"
                  : `showing comments left on ${activeVersionLabel}`}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  data-testid="shared-review-toggle-all-version-comments"
                  onClick={() => setShowAllVersionComments((v) => !v)}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: t.text,
                    background: "transparent",
                    border: `1px solid ${t.border}`,
                    borderRadius: "6px",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  {showAllVersionComments ? `Only ${activeVersionLabel}` : "Show all"}
                </button>
                <button
                  onClick={() => setSelectedVersionId(null)}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: t.text,
                    background: "transparent",
                    border: `1px solid ${t.border}`,
                    borderRadius: "6px",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Back to latest
                </button>
              </div>
            </div>
          )}

          {activeFileUrl ? (
            <VideoPlayer
              src={buildSrc(activeFileUrl)}
              markers={visibleComments.map((c) => ({
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
            <UploaderBadge
              name={deliverable.uploadedByName ?? null}
              avatarUrl={deliverable.uploadedByAvatarUrl ?? null}
              size={18}
              fontSize={11}
            />
          </div>

          {(() => {
            const previousCuts = versions.filter(
              (v) => v.fileUrl !== deliverable.fileUrl,
            );
            if (previousCuts.length === 0) return null;
            return (
              <div
                data-testid="shared-review-previous-cuts"
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    fontSize: "10px",
                    color: t.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "10px",
                  }}
                >
                  Previous cuts ({previousCuts.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {previousCuts.map((v) => (
                    <div
                      key={v.id}
                      data-testid={`shared-review-previous-cut-${v.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: t.bg,
                        border: `1px solid ${t.borderSubtle}`,
                        borderRadius: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 700,
                            fontSize: "10px",
                            color: t.text,
                            background: t.bgCard,
                            border: `1px solid ${t.border}`,
                            borderRadius: "4px",
                            padding: "2px 8px",
                          }}
                        >
                          {v.version}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 400,
                            fontSize: "11px",
                            color: t.textMuted,
                          }}
                        >
                          Uploaded{" "}
                          {new Date(v.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <a
                        href={buildSrc(v.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 600,
                          fontSize: "11px",
                          color: t.text,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        View
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
            comments={visibleComments}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onCommentClick={handleCommentClick}
            activeTimestamp={activeTimestamp}
            isPublic={true}
            publicAuthorName={authorName}
            onPublicAuthorNameChange={setAuthorName}
            versionLabelById={versionLabelById}
          />
        </div>
      </div>
    </div>
  );
}
