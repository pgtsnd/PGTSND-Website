import { useState, useEffect } from "react";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api, type Deliverable, type Review } from "../lib/api";

export default function ClientVideoReview() {
  const { t } = useTheme();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getClientDeliverables()
      .then((data) => {
        const pendingOrReview = data.filter(
          (d) => d.status === "in_review" || d.status === "pending",
        );
        const allDeliverables = [...pendingOrReview, ...data.filter(
          (d) => d.status !== "in_review" && d.status !== "pending",
        )];
        setDeliverables(allDeliverables);
        if (pendingOrReview.length > 0) {
          setSelectedDeliverable(pendingOrReview[0]);
        } else if (allDeliverables.length > 0) {
          setSelectedDeliverable(allDeliverables[0]);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDeliverable) return;
    api
      .getDeliverableReviews(selectedDeliverable.id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [selectedDeliverable?.id]);

  const handleApprove = async () => {
    if (!selectedDeliverable) return;
    setSubmitting(true);
    try {
      await api.approveDeliverable(selectedDeliverable.id, comment || undefined);
      setActionMessage("Approved successfully!");
      const updated = { ...selectedDeliverable, status: "approved" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => d.id === selectedDeliverable.id ? updated : d),
      );
      setComment("");
    } catch (err: unknown) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    }
    setSubmitting(false);
  };

  const handleRequestRevision = async () => {
    if (!selectedDeliverable || !comment.trim()) {
      setActionMessage("Please provide feedback for the revision request.");
      return;
    }
    setSubmitting(true);
    try {
      await api.requestRevision(selectedDeliverable.id, comment);
      setActionMessage("Revision requested.");
      const updated = { ...selectedDeliverable, status: "revision_requested" };
      setSelectedDeliverable(updated);
      setDeliverables((prev) =>
        prev.map((d) => d.id === selectedDeliverable.id ? updated : d),
      );
      setComment("");
    } catch (err: unknown) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    }
    setSubmitting(false);
  };

  function timeAgo(date: string | Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

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
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: t.textTertiary }}>Loading...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: "rgba(255,100,100,0.8)" }}>{error}</p>
        </div>
      </ClientLayout>
    );
  }

  if (deliverables.length === 0) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 48px" }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "16px" }}>Review</h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: t.textMuted }}>
            No deliverables to review yet. Your team will push content here when it's ready.
          </p>
        </div>
      </ClientLayout>
    );
  }

  const isPending = selectedDeliverable && (selectedDeliverable.status === "in_review" || selectedDeliverable.status === "pending");

  return (
    <ClientLayout>
      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "4px" }}>
              {selectedDeliverable?.projectName}
            </p>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text }}>Review</h1>
          </div>
          {isPending && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleRequestRevision}
                disabled={submitting}
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: "#000000", background: "#60d060", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                Approve This Draft
              </button>
            </div>
          )}
        </div>

        {actionMessage && (
          <div style={{ padding: "12px 16px", background: actionMessage.startsWith("Error") ? "rgba(255,100,100,0.08)" : "rgba(96,208,96,0.08)", border: `1px solid ${actionMessage.startsWith("Error") ? "rgba(255,100,100,0.2)" : "rgba(96,208,96,0.2)"}`, borderRadius: "8px", marginBottom: "16px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: actionMessage.startsWith("Error") ? "rgba(255,100,100,0.8)" : "rgba(96,208,96,0.8)" }}>{actionMessage}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {deliverables.filter((d) => d.status === "in_review" || d.status === "pending").map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDeliverable(d); setActionMessage(null); }}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: selectedDeliverable?.id === d.id ? 600 : 400,
                    fontSize: "12px",
                    color: selectedDeliverable?.id === d.id ? t.text : t.textMuted,
                    background: selectedDeliverable?.id === d.id ? t.activeNav : "transparent",
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
              <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "6px" }}>
                      {selectedDeliverable.title}
                    </h3>
                    {selectedDeliverable.description && (
                      <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary }}>
                        {selectedDeliverable.description}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: statusColor(selectedDeliverable.status),
                    background: `${statusColor(selectedDeliverable.status)}12`,
                    padding: "4px 12px",
                    borderRadius: "4px",
                  }}>
                    {statusLabel(selectedDeliverable.status)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Type:</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{selectedDeliverable.type}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Version:</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>{selectedDeliverable.version || "v1"}</span>
                  </div>
                  {selectedDeliverable.submittedAt && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Submitted:</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textSecondary }}>
                        {timeAgo(selectedDeliverable.submittedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {selectedDeliverable.fileUrl && (
                  <div style={{ marginTop: "16px", padding: "12px 16px", background: t.hoverBg, borderRadius: "8px" }}>
                    <a href={selectedDeliverable.fileUrl} target="_blank" rel="noopener" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.text, textDecoration: "underline", textUnderlineOffset: "3px" }}>
                      View File
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>
              Feedback
            </h2>

            {isPending && (
              <div style={{ marginBottom: "16px" }}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your feedback..."
                  style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.text, background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px 14px", width: "100%", minHeight: "80px", resize: "none", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto" }}>
              {reviews.length === 0 && (
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textMuted }}>
                  No feedback yet
                </p>
              )}
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{ padding: "14px 0", borderBottom: `1px solid ${t.borderSubtle}` }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: statusColor(review.status),
                      background: `${statusColor(review.status)}12`,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}>
                      {statusLabel(review.status)}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: t.textMuted }}>
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.6 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
