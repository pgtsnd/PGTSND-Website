import { useState } from "react";
import { useTheme } from "./ThemeContext";
import { formatTime } from "./VideoPlayer";

export interface VideoCommentReply {
  id: string;
  commentId: string;
  authorId: string | null;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface VideoComment {
  id: string;
  deliverableId: string;
  authorId: string | null;
  authorName: string;
  timestampSeconds: number;
  content: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedNote: string | null;
  replies: VideoCommentReply[];
}

interface VideoReviewPanelProps {
  comments: VideoComment[];
  onAddComment: (timestampSeconds: number, content: string) => Promise<void>;
  onAddReply: (commentId: string, content: string) => Promise<void>;
  onCommentClick: (comment: VideoComment) => void;
  activeTimestamp: number | null;
  isPublic?: boolean;
  publicAuthorName?: string;
  onPublicAuthorNameChange?: (name: string) => void;
  onResolveComment?: (commentId: string, resolved: boolean, note?: string) => Promise<void>;
  hideTimestamps?: boolean;
}

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function VideoReviewPanel({
  comments,
  onAddComment,
  onAddReply,
  onCommentClick,
  activeTimestamp,
  isPublic = false,
  publicAuthorName = "",
  onPublicAuthorNameChange,
  onResolveComment,
  hideTimestamps = false,
}: VideoReviewPanelProps) {
  const { t } = useTheme();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hideResolved, setHideResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [showResolvedSummary, setShowResolvedSummary] = useState(false);
  const composerOpen = hideTimestamps || activeTimestamp !== null;
  const composerTimestamp = hideTimestamps ? 0 : activeTimestamp;

  const unresolvedCount = comments.filter((c) => !c.resolvedAt).length;
  const resolvedComments = comments
    .filter((c) => !!c.resolvedAt)
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime());
  const resolvedCount = resolvedComments.length;
  const visibleComments = hideResolved
    ? comments.filter((c) => !c.resolvedAt)
    : comments;

  const handleSubmitComment = async () => {
    if (!newComment.trim() || composerTimestamp === null) return;
    if (isPublic && !publicAuthorName.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(composerTimestamp, newComment.trim());
      setNewComment("");
    } catch {
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    if (isPublic && !publicAuthorName.trim()) return;
    setSubmitting(true);
    try {
      await onAddReply(commentId, replyContent.trim());
      setReplyContent("");
      setReplyingTo(null);
    } catch {
    }
    setSubmitting(false);
  };

  const handleResolve = async (commentId: string) => {
    if (!onResolveComment) return;
    setSubmitting(true);
    try {
      await onResolveComment(commentId, true, resolveNote.trim() || undefined);
      setResolvingId(null);
      setResolveNote("");
    } catch {
    }
    setSubmitting(false);
  };

  const handleReopen = async (commentId: string) => {
    if (!onResolveComment) return;
    setSubmitting(true);
    try {
      await onResolveComment(commentId, false);
    } catch {
    }
    setSubmitting(false);
  };

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={f({
          fontWeight: 700, fontSize: "11px", textTransform: "uppercase",
          letterSpacing: "0.08em", color: t.textTertiary,
        })}>
          Comments
          <span style={f({
            marginLeft: "8px", fontWeight: 600, fontSize: "10px",
            color: unresolvedCount > 0 ? "rgba(255,200,60,0.9)" : t.textMuted,
            background: unresolvedCount > 0 ? "rgba(255,200,60,0.1)" : "transparent",
            border: unresolvedCount > 0 ? "none" : `1px solid ${t.borderSubtle}`,
            padding: "2px 8px", borderRadius: "10px",
            textTransform: "none", letterSpacing: 0,
          })}>
            {unresolvedCount} unresolved
          </span>
          {resolvedCount > 0 && (
            <span style={f({
              marginLeft: "6px", fontWeight: 600, fontSize: "10px",
              color: "#0a0",
              background: "rgba(0,170,0,0.12)",
              padding: "2px 8px", borderRadius: "10px",
              textTransform: "none", letterSpacing: 0,
            })}>
              {resolvedCount} resolved
            </span>
          )}
          <span style={f({
            marginLeft: "6px", fontWeight: 400, fontSize: "10px",
            color: t.textMuted, textTransform: "none", letterSpacing: 0,
          })}>
            of {comments.length}
          </span>
        </h3>
        {comments.some((c) => c.resolvedAt) && (
          <button
            onClick={() => setHideResolved((v) => !v)}
            style={f({
              fontWeight: 500, fontSize: "10px",
              color: hideResolved ? "rgba(255,200,60,0.9)" : t.textMuted,
              background: "none",
              border: `1px solid ${hideResolved ? "rgba(255,200,60,0.5)" : t.border}`,
              borderRadius: "4px", padding: "3px 8px", cursor: "pointer",
            })}
          >
            {hideResolved ? "Showing unresolved" : "Hide resolved"}
          </button>
        )}
      </div>

      {composerOpen && (
        <div style={{
          marginBottom: "16px", background: t.bgCard,
          border: `1px solid rgba(255,200,60,0.3)`, borderRadius: "8px",
          padding: "12px",
        }}>
          {!hideTimestamps && activeTimestamp !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={f({
                fontWeight: 600, fontSize: "10px", color: "rgba(255,200,60,0.9)",
                background: "rgba(255,200,60,0.1)", padding: "2px 8px",
                borderRadius: "4px", fontVariantNumeric: "tabular-nums",
              })}>
                {formatTime(activeTimestamp)}
              </span>
              <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
                Comment at this timestamp
              </span>
            </div>
          )}
          {isPublic && (
            <input
              value={publicAuthorName}
              onChange={(e) => onPublicAuthorNameChange?.(e.target.value)}
              placeholder="Your name"
              style={f({
                fontWeight: 400, fontSize: "12px", color: t.text,
                background: t.bgInput, border: `1px solid ${t.border}`,
                borderRadius: "6px", padding: "8px 10px", width: "100%",
                outline: "none", boxSizing: "border-box", marginBottom: "8px",
              })}
            />
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your feedback..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment();
            }}
            style={f({
              fontWeight: 400, fontSize: "12px", color: t.text,
              background: t.bgInput, border: `1px solid ${t.border}`,
              borderRadius: "6px", padding: "8px 10px", width: "100%",
              minHeight: "60px", resize: "none", outline: "none",
              boxSizing: "border-box",
            })}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              style={f({
                fontWeight: 600, fontSize: "11px", color: "#000",
                background: "rgba(255,200,60,0.9)", border: "none",
                borderRadius: "6px", padding: "6px 14px", cursor: "pointer",
                opacity: submitting || !newComment.trim() ? 0.5 : 1,
              })}
            >
              Add Comment
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {resolvedCount > 0 && (
          <div style={{
            marginBottom: "12px",
            border: `1px solid ${t.borderSubtle}`,
            borderRadius: "6px",
            background: "rgba(0,170,0,0.04)",
          }}>
            <button
              onClick={() => setShowResolvedSummary((v) => !v)}
              style={f({
                display: "flex", alignItems: "center", gap: "8px",
                width: "100%", background: "none", border: "none",
                padding: "8px 10px", cursor: "pointer", textAlign: "left",
              })}
              aria-expanded={showResolvedSummary}
            >
              <svg
                width="10" height="10" viewBox="0 0 12 12" fill="none"
                style={{
                  transform: showResolvedSummary ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                <path d="M4 2 L8 6 L4 10" stroke={t.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={f({
                fontWeight: 600, fontSize: "11px", color: t.textSecondary,
              })}>
                Resolved this round
              </span>
              <span style={f({
                fontWeight: 600, fontSize: "10px", color: "#0a0",
                background: "rgba(0,170,0,0.12)", padding: "1px 7px",
                borderRadius: "10px",
              })}>
                {resolvedCount}
              </span>
            </button>
            {showResolvedSummary && (
              <div style={{ padding: "0 10px 8px 10px" }}>
                {resolvedComments.map((rc) => (
                  <div
                    key={rc.id}
                    onClick={() => onCommentClick(rc)}
                    style={{
                      padding: "8px 0",
                      borderTop: `1px solid ${t.borderSubtle}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                      {!hideTimestamps && (
                        <span style={f({
                          fontWeight: 600, fontSize: "10px", color: "rgba(255,200,60,0.9)",
                          background: "rgba(255,200,60,0.1)", padding: "2px 6px",
                          borderRadius: "4px", fontVariantNumeric: "tabular-nums",
                        })}>
                          {formatTime(rc.timestampSeconds)}
                        </span>
                      )}
                      <span style={f({ fontWeight: 600, fontSize: "11px", color: t.text })}>
                        {rc.authorName}
                      </span>
                      <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>
                        resolved by {rc.resolvedByName ?? "team"}
                        {rc.resolvedAt && ` · ${timeAgo(rc.resolvedAt)}`}
                      </span>
                    </div>
                    <p style={f({
                      fontWeight: 400, fontSize: "11px", color: t.textMuted,
                      lineHeight: 1.4, margin: "0 0 4px 0",
                      textDecoration: "line-through",
                    })}>
                      {rc.content}
                    </p>
                    {rc.resolvedNote && (
                      <p style={f({
                        fontWeight: 400, fontSize: "11px", color: t.textSecondary,
                        lineHeight: 1.4, margin: 0,
                      })}>
                        {rc.resolvedNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {visibleComments.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ marginBottom: "8px" }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
              {comments.length === 0
                ? hideTimestamps
                  ? "No comments yet. Use the box above to leave feedback."
                  : "No comments yet. Click the Comment button on the video player to add one."
                : "All comments are resolved."}
            </p>
          </div>
        )}

        {visibleComments.map((comment) => {
          const isResolved = !!comment.resolvedAt;
          return (
          <div
            key={comment.id}
            style={{
              padding: "12px 0",
              borderBottom: `1px solid ${t.borderSubtle}`,
              opacity: isResolved ? 0.55 : 1,
            }}
          >
            <div
              onClick={() => onCommentClick(comment)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                {!hideTimestamps && (
                  <button
                    style={f({
                      fontWeight: 600, fontSize: "10px", color: "rgba(255,200,60,0.9)",
                      background: "rgba(255,200,60,0.1)", padding: "2px 8px",
                      borderRadius: "4px", border: "none", cursor: "pointer",
                      fontVariantNumeric: "tabular-nums",
                    })}
                    title="Jump to timestamp"
                  >
                    {formatTime(comment.timestampSeconds)}
                  </button>
                )}
                <span style={f({ fontWeight: 600, fontSize: "11px", color: t.text })}>
                  {comment.authorName}
                </span>
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>
                  {timeAgo(comment.createdAt)}
                </span>
                {isResolved && (
                  <span style={f({
                    fontWeight: 600, fontSize: "9px", color: "#0a0",
                    background: "rgba(0,170,0,0.12)", padding: "2px 6px",
                    borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em",
                  })}>
                    Resolved
                  </span>
                )}
              </div>
              <p style={f({
                fontWeight: 400, fontSize: "12px", color: t.textSecondary,
                lineHeight: 1.5, marginLeft: "2px",
                textDecoration: isResolved ? "line-through" : "none",
              })}>
                {comment.content}
              </p>
            </div>

            {isResolved && (
              <div style={{
                marginTop: "6px", marginLeft: "2px",
                padding: "6px 8px", background: "rgba(0,170,0,0.06)",
                border: "1px solid rgba(0,170,0,0.15)", borderRadius: "4px",
              }}>
                <div style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted })}>
                  Resolved by {comment.resolvedByName ?? "team"}
                  {comment.resolvedAt && ` · ${timeAgo(comment.resolvedAt)}`}
                </div>
                {comment.resolvedNote && (
                  <div style={f({
                    fontWeight: 400, fontSize: "11px", color: t.textSecondary,
                    marginTop: "4px", lineHeight: 1.4,
                  })}>
                    {comment.resolvedNote}
                  </div>
                )}
              </div>
            )}

            {comment.replies.length > 0 && (
              <div style={{ marginLeft: "16px", marginTop: "8px", borderLeft: `2px solid ${t.borderSubtle}`, paddingLeft: "12px" }}>
                {comment.replies.map((reply) => (
                  <div key={reply.id} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={f({ fontWeight: 600, fontSize: "11px", color: t.text })}>
                        {reply.authorName}
                      </span>
                      <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>
                        {timeAgo(reply.createdAt)}
                      </span>
                    </div>
                    <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textSecondary, lineHeight: 1.5 })}>
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "6px", display: "flex", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
              {replyingTo === comment.id ? (
                <div style={{ marginLeft: "16px", flex: 1 }}>
                  {isPublic && (
                    <input
                      value={publicAuthorName}
                      onChange={(e) => onPublicAuthorNameChange?.(e.target.value)}
                      placeholder="Your name"
                      style={f({
                        fontWeight: 400, fontSize: "11px", color: t.text,
                        background: t.bgInput, border: `1px solid ${t.border}`,
                        borderRadius: "6px", padding: "6px 8px", width: "100%",
                        outline: "none", boxSizing: "border-box", marginBottom: "6px",
                      })}
                    />
                  )}
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Reply..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitReply(comment.id);
                    }}
                    style={f({
                      fontWeight: 400, fontSize: "11px", color: t.text,
                      background: t.bgInput, border: `1px solid ${t.border}`,
                      borderRadius: "6px", padding: "6px 8px", width: "100%",
                      minHeight: "40px", resize: "none", outline: "none",
                      boxSizing: "border-box",
                    })}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={submitting || !replyContent.trim()}
                      style={f({
                        fontWeight: 600, fontSize: "10px", color: "#000",
                        background: t.accent, border: "none",
                        borderRadius: "4px", padding: "4px 10px", cursor: "pointer",
                        opacity: submitting || !replyContent.trim() ? 0.5 : 1,
                      })}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                      style={f({
                        fontWeight: 500, fontSize: "10px", color: t.textMuted,
                        background: "none", border: `1px solid ${t.border}`,
                        borderRadius: "4px", padding: "4px 10px", cursor: "pointer",
                      })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : resolvingId === comment.id ? (
                <div style={{ marginLeft: "16px", flex: 1 }}>
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Optional note about how this was addressed..."
                    autoFocus
                    style={f({
                      fontWeight: 400, fontSize: "11px", color: t.text,
                      background: t.bgInput, border: `1px solid ${t.border}`,
                      borderRadius: "6px", padding: "6px 8px", width: "100%",
                      minHeight: "40px", resize: "none", outline: "none",
                      boxSizing: "border-box",
                    })}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <button
                      onClick={() => handleResolve(comment.id)}
                      disabled={submitting}
                      style={f({
                        fontWeight: 600, fontSize: "10px", color: "#fff",
                        background: "#0a0", border: "none",
                        borderRadius: "4px", padding: "4px 10px", cursor: "pointer",
                        opacity: submitting ? 0.5 : 1,
                      })}
                    >
                      Mark resolved
                    </button>
                    <button
                      onClick={() => { setResolvingId(null); setResolveNote(""); }}
                      style={f({
                        fontWeight: 500, fontSize: "10px", color: t.textMuted,
                        background: "none", border: `1px solid ${t.border}`,
                        borderRadius: "4px", padding: "4px 10px", cursor: "pointer",
                      })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    style={f({
                      fontWeight: 500, fontSize: "10px", color: t.textMuted,
                      background: "none", border: "none", cursor: "pointer",
                      padding: "2px 0",
                    })}
                  >
                    Reply
                  </button>
                  {onResolveComment && (
                    isResolved ? (
                      <button
                        onClick={() => handleReopen(comment.id)}
                        disabled={submitting}
                        style={f({
                          fontWeight: 500, fontSize: "10px", color: t.textMuted,
                          background: "none", border: "none", cursor: "pointer",
                          padding: "2px 0",
                        })}
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => { setResolvingId(comment.id); setResolveNote(""); }}
                        style={f({
                          fontWeight: 500, fontSize: "10px", color: "#0a0",
                          background: "none", border: "none", cursor: "pointer",
                          padding: "2px 0",
                        })}
                      >
                        Resolve
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
