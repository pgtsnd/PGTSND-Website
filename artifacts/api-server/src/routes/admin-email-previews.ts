import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  renderReviewReadyEmail,
  renderNewCommentEmail,
  renderPublicCommentEmail,
  renderCommentResolvedEmail,
} from "../services/email-templates";

const router = Router();

type PreviewId =
  | "review-ready"
  | "new-comment"
  | "new-comment-reply"
  | "public-comment"
  | "public-comment-reply"
  | "comment-resolved"
  | "comment-resolved-with-note";

interface PreviewDef {
  id: PreviewId;
  label: string;
  description: string;
  render: () => string;
}

const SAMPLE_LINK = "https://pgtsnd.example.com/client-hub/review?d=sample";

const PREVIEWS: PreviewDef[] = [
  {
    id: "review-ready",
    label: "Review Ready",
    description:
      "Sent to clients when a new cut is uploaded and ready for review.",
    render: () =>
      renderReviewReadyEmail({
        recipientName: "Alex Morgan",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "new-comment",
    label: "New Comment",
    description: "Sent when a teammate or client leaves a new comment.",
    render: () =>
      renderNewCommentEmail({
        actorName: "Jamie Chen",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        content:
          "Love the opening montage! Can we trim the boat shot by about a second?\nIt feels a touch long before the title hits.",
        timestampLabel: "00:12",
        isReply: false,
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "new-comment-reply",
    label: "New Comment (Reply)",
    description:
      "Reply variant of the new-comment email — slightly different copy.",
    render: () =>
      renderNewCommentEmail({
        actorName: "Jamie Chen",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        content: "Agreed — let's tighten that to ~0.6s and re-export.",
        timestampLabel: "00:12",
        isReply: true,
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "public-comment",
    label: "Public Comment",
    description:
      "Sent when a viewer on a shared review link leaves a comment.",
    render: () =>
      renderPublicCommentEmail({
        authorName: "Sam Rivera",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        content:
          "Color in the wheelhouse looks a little cool to me — could we warm it up slightly?",
        timestampLabel: "01:43",
        isReply: false,
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "public-comment-reply",
    label: "Public Comment (Reply)",
    description: "Reply from a shared-link viewer.",
    render: () =>
      renderPublicCommentEmail({
        authorName: "Sam Rivera",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        content: "Thanks — that warmer pass looks great.",
        timestampLabel: "01:43",
        isReply: true,
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "comment-resolved",
    label: "Comment Resolved",
    description: "Sent when a comment a user left is marked resolved.",
    render: () =>
      renderCommentResolvedEmail({
        recipientName: "Alex Morgan",
        resolverName: "Jamie Chen",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        originalComment:
          "Can we trim the boat shot by about a second before the title hits?",
        timestampLabel: "00:12",
        resolutionNote: null,
        link: SAMPLE_LINK,
      }),
  },
  {
    id: "comment-resolved-with-note",
    label: "Comment Resolved (with note)",
    description: "Resolved variant including an optional resolution note.",
    render: () =>
      renderCommentResolvedEmail({
        recipientName: "Alex Morgan",
        resolverName: "Jamie Chen",
        projectName: "Bering Sea Crabbers — Season 3 Sizzle",
        deliverableTitle: "Hero Cut v2",
        originalComment:
          "Can we trim the boat shot by about a second before the title hits?",
        timestampLabel: "00:12",
        resolutionNote:
          "Trimmed to 0.6s and re-exported. New cut uploaded as v3 — ready for another look.",
        link: SAMPLE_LINK,
      }),
  },
];

router.get(
  "/admin/email-previews",
  requireRole("owner", "partner"),
  (_req, res) => {
    res.json({
      templates: PREVIEWS.map((p) => ({
        id: p.id,
        label: p.label,
        description: p.description,
      })),
    });
  },
);

router.get(
  "/admin/email-previews/:id",
  requireRole("owner", "partner"),
  (req, res) => {
    const preview = PREVIEWS.find((p) => p.id === req.params.id);
    if (!preview) {
      res.status(404).json({ error: "Unknown email template" });
      return;
    }

    const html = preview.render();

    if (req.query.format === "html") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.send(html);
      return;
    }

    res.json({
      id: preview.id,
      label: preview.label,
      description: preview.description,
      html,
    });
  },
);

export default router;
