import { useState, useEffect, useCallback, useMemo } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import VideoPlayer from "../components/VideoPlayer";
import VideoReviewPanel from "../components/VideoReviewPanel";
import type { VideoComment } from "../components/VideoReviewPanel";
import { api, type Deliverable, type DeliverableVersion, type VideoCommentWithReplies } from "../lib/api";
import UploaderBadge from "../components/UploaderBadge";
import { ClientVideoReviewSkeleton, ErrorState } from "../components/TeamLoadingStates";
import { useToast } from "../components/Toast";
import { useTeamAuth } from "../contexts/TeamAuthContext";

export default function ClientVideoReview() {
  const { t } = useTheme();
  const { toast } = useToast();
  const { currentUser } = useTeamAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [comments, setComments] = useState<VideoCommentWithReplies[]>([]);
  const [deliverableVersions, setDeliverableVersions] = useState<DeliverableVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Deep-link query params from the resolved-comment email:
  // ?deliverableId=...&commentId=...&action=reply|reopen
  const deepLink = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      deliverableId: sp.get("deliverableId"),
      commentId: sp.get("commentId"),
      action: sp.get("action") as "reply" | "reopen" | null,
    };
  }, []);
  const [highlightCommentId] = useState<string | null>(deepLink.commentId);
  const [openReplyForCommentId, setOpenReplyForCommentId] = useState<string | null>(
    deepLink.action === "reply" ? deepLink.commentId : null,
  );
  const [pendingReopenId, setPendingReopenId] = useState<string | null>(
    deepLink.action === "reopen" ? deepLink.commentId : null,
  );
  const refetch = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getClientDeliverables()
      .then((data) => {
        const pendingOrReview = data.filter(
          (d) => d.status === "in_review" || d.status === "pending",
        );
        const allDeliverables = [
          ...pendingOrReview,
          ...data.filter(
            (d) => d.status !== "in_review" && d.status !== "pending",
          ),
        ];
        setDeliverables(allDeliverables);
        // Prefer the deep-linked deliverable from the email, falling back to
        // the first pending/in-review item, then anything available.
        const deepLinked = deepLink.deliverableId
          ? allDeliverables.find((d) => d.id === deepLink.deliverableId)
          : null;
        if (deepLinked) {
          setSelectedDeliverable(deepLinked);
        } else if (pendingOrReview.length > 0) {
          setSelectedDeliverable(pendingOrReview[0]);
        } else if (allDeliverables.length > 0) {
          setSelectedDeliverable(allDeliverables[0]);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedDeliverable) return;
    api
      .getVideoComments(selectedDeliverable.id)
      .then(setComments)
      .catch(() => setComments([]));
    api
      .getDeliverableVersions(selectedDeliverable.id)
      .then(setDeliverableVersions)
      .catch(() => setDeliverableVersions([]));
  }, [selectedDeliverable?.id]);

  const handleApprove = async () => {
    if (!selectedDeliverable) return;
    setSubmitting(true);
    try {
      await api.approveDeliverable(selectedDeliverable.id);
      toast("Approved successfully!", "success");
      const updated = { ...selectedDeliverable, status: "approved" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === selectedDeliverable.id ? updated : d)),
      );
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to approve", "error");
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
      toast("Revision requested", "success");
      const updated = { ...selectedDeliverable, status: "revision_requested" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => (d.id === selectedDeliverable.id ? updated : d)),
      );
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to request revision", "error");
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
      // Clear the deep-link auto-open hint once the user has replied so we
      // don't keep re-opening the composer if they navigate back.
      setOpenReplyForCommentId(null);
    },
    [],
  );

  // Auto-execute the deep-linked reopen action once comments load.
  useEffect(() => {
    if (!pendingReopenId) return;
    const target = comments.find((c) => c.id === pendingReopenId);
    if (!target || !target.resolvedAt) return;
    const isMine =
      currentUser?.id && target.authorId === currentUser.id ? true : false;
    if (!isMine) {
      toast("Only the original author can reopen this comment", "error");
      setPendingReopenId(null);
      return;
    }
    const id = pendingReopenId;
    setPendingReopenId(null);
    void (async () => {
      try {
        const updated = await api.reopenVideoComment(id);
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        );
        toast("Comment reopened", "success");
      } catch (err: unknown) {
        toast(
          err instanceof Error ? err.message : "Failed to reopen comment",
          "error",
        );
      }
    })();
  }, [pendingReopenId, comments, currentUser?.id, toast]);

  const handleReopenComment = useCallback(
    async (commentId: string) => {
      try {
        const updated = await api.reopenVideoComment(commentId);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)),
        );
        toast("Comment reopened", "success");
      } catch (err: unknown) {
        toast(
          err instanceof Error ? err.message : "Failed to reopen comment",
          "error",
        );
      }
    },
    [toast],
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

  type Kind = "video" | "image" | "pdf" | "other";
  const classify = (d: Deliverable | null): Kind => {
    if (!d) return "other";
    const dtype = (d.type ?? "").toLowerCase();
    const url = (d.fileUrl ?? "").toLowerCase().split("?")[0] ?? "";
    const ext = url.includes(".") ? url.split(".").pop() ?? "" : "";
    if (dtype === "video" || ["mp4", "mov", "webm", "m4v", "avi", "mkv"].includes(ext)) return "video";
    if (dtype === "image" || dtype === "graphic" || dtype === "graphics" ||
        dtype === "photo" || dtype === "photos" || dtype === "still" || dtype === "stills" ||
        ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif", "svg"].includes(ext))
      return "image";
    if (dtype === "pdf" || ext === "pdf") return "pdf";
    return "other";
  };
  const kind = classify(selectedDeliverable);
  const isVideo = kind === "video";

  const versions = selectedDeliverable
    ? deliverables
        .filter(
          (d) =>
            d.title === selectedDeliverable.title &&
            d.projectId === selectedDeliverable.projectId,
        )
        .sort((a, b) => (a.version ?? "").localeCompare(b.version ?? ""))
    : [];

  const previousVersionUploadedAt = (() => {
    if (!selectedDeliverable) return null;
    const currentMs = new Date(selectedDeliverable.createdAt).getTime();
    const earlier = versions
      .filter(
        (v) =>
          v.id !== selectedDeliverable.id &&
          new Date(v.createdAt).getTime() < currentMs,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return earlier[0]?.createdAt ?? null;
  })();

  if (loading) {
    return (
      <ClientLayout>
        <ClientVideoReviewSkeleton />
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState
            message={error || "We couldn't load your videos. Please check your connection and try again."}
            onRetry={refetch}
          />
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
              Client Review
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                color: t.textMuted,
                marginTop: "4px",
              }}
            >
              Review videos, images, and documents from your team.
            </p>
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

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {deliverables
            .filter((d) => d.status === "in_review" || d.status === "pending")
            .map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDeliverable(d);
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
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: t.textMuted,
                    border: `1px solid ${t.borderSubtle}`,
                    padding: "3px 10px",
                    borderRadius: "4px",
                  }}
                >
                  {kind === "other" ? "File" : kind}
                </span>
                <UploaderBadge
                  name={selectedDeliverable.uploadedByName ?? null}
                  avatarUrl={selectedDeliverable.uploadedByAvatarUrl ?? null}
                  size={18}
                  fontSize={11}
                />
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
              isVideo ? (
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
              ) : kind === "image" ? (
                <div
                  style={{
                    background: "#000",
                    border: `1px solid ${t.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "320px",
                    maxHeight: "75vh",
                  }}
                >
                  <img
                    src={selectedDeliverable.fileUrl}
                    alt={selectedDeliverable.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "75vh",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              ) : kind === "pdf" ? (
                <div
                  style={{
                    background: t.bgCard,
                    border: `1px solid ${t.border}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    src={selectedDeliverable.fileUrl}
                    title={selectedDeliverable.title}
                    style={{
                      width: "100%",
                      height: "75vh",
                      border: "none",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      borderTop: `1px solid ${t.border}`,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <a
                      href={selectedDeliverable.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "11px",
                        color: t.text,
                        textDecoration: "none",
                        border: `1px solid ${t.border}`,
                        padding: "6px 12px",
                        borderRadius: "6px",
                      }}
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: t.bgCard,
                    border: `1px solid ${t.border}`,
                    borderRadius: "10px",
                    padding: "60px 24px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: t.textMuted,
                      marginBottom: "12px",
                    }}
                  >
                    No inline preview available for this file.
                  </p>
                  <a
                    href={selectedDeliverable.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: t.text,
                      textDecoration: "none",
                      border: `1px solid ${t.border}`,
                      padding: "8px 16px",
                      borderRadius: "6px",
                      display: "inline-block",
                    }}
                  >
                    Download / open file
                  </a>
                </div>
              )
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
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: t.textMuted,
                  }}
                >
                  No file attached yet
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
                  The team will upload it when it's ready for review.
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

            {(() => {
              const previousCuts = deliverableVersions.filter(
                (v) => v.fileUrl !== selectedDeliverable.fileUrl,
              );
              if (previousCuts.length === 0) return null;
              return (
                <div
                  data-testid="client-previous-cuts"
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
                        data-testid={`client-previous-cut-${v.id}`}
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
                          href={v.fileUrl}
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

            <div
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: "10px",
                padding: "20px",
                marginTop: "24px",
              }}
            >
              <VideoReviewPanel
                comments={comments}
                onAddComment={handleAddComment}
                onAddReply={handleAddReply}
                onCommentClick={handleCommentClick}
                activeTimestamp={activeTimestamp}
                hideTimestamps={!isVideo}
                previousVersionUploadedAt={previousVersionUploadedAt}
                currentVersionLabel={selectedDeliverable.version ?? null}
                onReopenComment={handleReopenComment}
                currentUserId={currentUser?.id ?? null}
                highlightCommentId={
                  selectedDeliverable && deepLink.deliverableId === selectedDeliverable.id
                    ? highlightCommentId
                    : null
                }
                openReplyForCommentId={
                  selectedDeliverable && deepLink.deliverableId === selectedDeliverable.id
                    ? openReplyForCommentId
                    : null
                }
              />
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
