import { useState, useEffect, useCallback } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import type { VideoComment } from "../components/VideoReviewPanel";
import { api, type Deliverable, type VideoCommentWithReplies } from "../lib/api";

export default function ClientVideoReview() {
  const { t } = useTheme();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [comments, setComments] = useState<VideoCommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientDeliverables()
      .then((data) => {
        const videoDeliverables = data.filter((d) => d.type === "video");
        const pendingOrReview = videoDeliverables.filter(
          (d) => d.status === "in_review" || d.status === "pending",
        );
        const allDeliverables = [
          ...pendingOrReview,
          ...videoDeliverables.filter(
            (d) => d.status !== "in_review" && d.status !== "pending",
          ),
        ];
        setDeliverables(allDeliverables);
        if (pendingOrReview.length > 0) {
          setSelectedDeliverable(pendingOrReview[0]);
        } else if (allDeliverables.length > 0) {
          setSelectedDeliverable(allDeliverables[0]);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDeliverable) return;
    api
      .getVideoComments(selectedDeliverable.id)
      .then(setComments)
      .catch(() => setComments([]));
  }, [selectedDeliverable?.id]);

  const handleApprove = async () => {
    if (!selectedDeliverable) return;
    setSubmitting(true);
    try {
      await api.approveDeliverable(selectedDeliverable.id);
      setActionMessage("Approved successfully!");
      const updated = { ...selectedDeliverable, status: "approved" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === selectedDeliverable.id ? updated : d)),
      );
    } catch (err: unknown) {
      setActionMessage(
        `Error: ${err instanceof Error ? err.message : "Failed"}`,
      );
    }
    setSubmitting(false);
  };

  const handleRequestRevision = async () => {
    if (!selectedDeliverable) return;
    const revisionComment = comments.length > 0
      ? "Revision requested - see timestamped comments for details"
      : "Revision requested";
    setSubmitting(true);
    try {
      await api.requestRevision(selectedDeliverable.id, revisionComment);
      setActionMessage("Revision requested.");
      const updated = { ...selectedDeliverable, status: "revision_requested" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === selectedDeliverable.id ? updated : d)),
      );
    } catch (err: unknown) {
      setActionMessage(
        `Error: ${err instanceof Error ? err.message : "Failed"}`,
      );
    }
    setSubmitting(false);
  };

  const handleAddComment = useCallback(
    async (timestampSeconds: number, content: string) => {
      if (!selectedDeliverable) return;
      const comment = await api.addVideoComment(
        selectedDeliverable.id,
        timestampSeconds,
        content,
      );
      setComments((prev) => [...prev, comment].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
      setActiveTimestamp(null);
    },
    [selectedDeliverable],
  );

  const handleAddReply = useCallback(
    async (commentId: string, content: string) => {
      const reply = await api.addVideoCommentReply(commentId, content);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c,
        ),
      );
    },
    [],
  );

  const handleCommentClick = useCallback((comment: VideoComment) => {
    setSeekTo(comment.timestampSeconds);
    setTimeout(() => setSeekTo(null), 100);
  }, []);

  const handleMarkerClick = useCallback(
    (id: string) => {
      const comment = comments.find((c) => c.id === id);
      if (comment) {
        handleCommentClick(comment);
      }
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

  const versions = selectedDeliverable
    ? deliverables
        .filter(
          (d) =>
            d.title === selectedDeliverable.title &&
            d.projectId === selectedDeliverable.projectId,
        )
        .sort((a, b) => (a.version ?? "").localeCompare(b.version ?? ""))
    : [];

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: t.textTertiary,
            }}
          >
            Loading...
          </p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: "rgba(255,100,100,0.8)",
            }}
          >
            {error}
          </p>
        </div>
      </ClientLayout>
    );
  }

  if (deliverables.length === 0) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: "24px",
              color: t.text,
              marginBottom: "16px",
            }}
          >
            Review
          </h1>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              color: t.textMuted,
            }}
          >
            No video deliverables to review yet. Your team will push content
            here when it's ready.
          </p>
        </div>
      </ClientLayout>
    );
  }

  const isPending =
    selectedDeliverable &&
    (selectedDeliverable.status === "in_review" ||
      selectedDeliverable.status === "pending");

  return (
    <ClientLayout>
      <div style={{ padding: "32px 48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                color: t.textMuted,
                marginBottom: "4px",
              }}
            >
              {selectedDeliverable?.projectName}
            </p>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: "24px",
                color: t.text,
              }}
            >
              Video Review
            </h1>
          </div>
          {isPending && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleRequestRevision}
                disabled={submitting}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: t.text,
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
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
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Approve
              </button>
            </div>
          )}
        </div>

        {actionMessage && (
          <div
            style={{
              padding: "12px 16px",
              background: actionMessage.startsWith("Error")
                ? "rgba(255,100,100,0.08)"
                : "rgba(96,208,96,0.08)",
              border: `1px solid ${actionMessage.startsWith("Error") ? "rgba(255,100,100,0.2)" : "rgba(96,208,96,0.2)"}`,
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
                fontSize: "13px",
                color: actionMessage.startsWith("Error")
                  ? "rgba(255,100,100,0.8)"
                  : "rgba(96,208,96,0.8)",
              }}
            >
              {actionMessage}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {deliverables
            .filter((d) => d.status === "in_review" || d.status === "pending")
            .map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDeliverable(d);
                  setActionMessage(null);
                  setActiveTimestamp(null);
                }}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: selectedDeliverable?.id === d.id ? 600 : 400,
                  fontSize: "12px",
                  color:
                    selectedDeliverable?.id === d.id ? t.text : t.textMuted,
                  background:
                    selectedDeliverable?.id === d.id
                      ? t.activeNav
                      : "transparent",
                  border: `1px solid ${selectedDeliverable?.id === d.id ? t.border : t.borderSubtle}`,
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                {d.title}
              </button>
            ))}
        </div>

        {selectedDeliverable && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
            <div>
              <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h3
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: t.text,
                    }}
                  >
                    {selectedDeliverable.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: statusColor(selectedDeliverable.status),
                      background: `${statusColor(selectedDeliverable.status)}12`,
                      padding: "4px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    {statusLabel(selectedDeliverable.status)}
                  </span>
                </div>
                {versions.length > 1 && (
                  <select
                    value={selectedDeliverable.id}
                    onChange={(e) => {
                      const v = deliverables.find((d) => d.id === e.target.value);
                      if (v) {
                        setSelectedDeliverable(v);
                        setActiveTimestamp(null);
                      }
                    }}
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      fontSize: "11px",
                      color: t.text,
                      background: t.bgCard,
                      border: `1px solid ${t.border}`,
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.version || "v1"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedDeliverable.fileUrl ? (
                <VideoPlayer
                  src={selectedDeliverable.fileUrl}
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
                    padding: "80px 24px",
                    textAlign: "center",
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.textMuted}
                    strokeWidth="1.5"
                    style={{ marginBottom: "12px" }}
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: t.textMuted,
                    }}
                  >
                    No video file attached yet
                  </p>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      color: t.textMuted,
                      marginTop: "4px",
                    }}
                  >
                    The team will upload the video when it's ready for review.
                  </p>
                </div>
              )}

              {selectedDeliverable.description && (
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    color: t.textMuted,
                    marginTop: "12px",
                  }}
                >
                  {selectedDeliverable.description}
                </p>
              )}
            </div>

            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: "10px",
                padding: "20px",
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
              }}
            >
              <VideoReviewPanel
                comments={comments}
                onAddComment={handleAddComment}
                onAddReply={handleAddReply}
                onCommentClick={handleCommentClick}
                activeTimestamp={activeTimestamp}
              />
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
