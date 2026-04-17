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

type FieldType = "text" | "textarea" | "boolean";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  default: string | boolean;
  optional?: boolean;
  help?: string;
}

interface PreviewDef {
  id: PreviewId;
  label: string;
  description: string;
  fields: FieldDef[];
  render: (values: Record<string, unknown>) => string;
}

const SAMPLE_LINK = "https://pgtsnd.example.com/client-hub/review?d=sample";

function str(
  values: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const v = values[key];
  if (typeof v !== "string") return fallback;
  const trimmed = v.trim();
  return trimmed.length > 0 ? v : fallback;
}

function strOrNull(
  values: Record<string, unknown>,
  key: string,
  fallback: string,
): string | null {
  const v = values[key];
  if (typeof v !== "string") return fallback;
  const trimmed = v.trim();
  return trimmed.length > 0 ? v : fallback;
}

function bool(
  values: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const v = values[key];
  if (typeof v === "boolean") return v;
  return fallback;
}

const COMMON = {
  projectName: "Bering Sea Crabbers — Season 3 Sizzle",
  deliverableTitle: "Hero Cut v2",
  link: SAMPLE_LINK,
};

const PREVIEWS: PreviewDef[] = [
  {
    id: "review-ready",
    label: "Review Ready",
    description:
      "Sent to clients when a new cut is uploaded and ready for review.",
    fields: [
      { key: "recipientName", label: "Recipient name", type: "text", default: "Alex Morgan" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      { key: "link", label: "Review link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderReviewReadyEmail({
        recipientName: str(v, "recipientName", "Alex Morgan"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "new-comment",
    label: "New Comment",
    description: "Sent when a teammate or client leaves a new comment.",
    fields: [
      { key: "actorName", label: "Commenter name", type: "text", default: "Jamie Chen" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "content",
        label: "Comment text",
        type: "textarea",
        default:
          "Love the opening montage! Can we trim the boat shot by about a second?\nIt feels a touch long before the title hits.",
      },
      { key: "timestampLabel", label: "Timestamp (e.g. 00:12)", type: "text", default: "00:12" },
      { key: "isReply", label: "Render as reply", type: "boolean", default: false },
      { key: "link", label: "Conversation link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderNewCommentEmail({
        actorName: str(v, "actorName", "Jamie Chen"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        content: str(
          v,
          "content",
          "Love the opening montage! Can we trim the boat shot by about a second?\nIt feels a touch long before the title hits.",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "00:12"),
        isReply: bool(v, "isReply", false),
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "new-comment-reply",
    label: "New Comment (Reply)",
    description:
      "Reply variant of the new-comment email — slightly different copy.",
    fields: [
      { key: "actorName", label: "Commenter name", type: "text", default: "Jamie Chen" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "content",
        label: "Reply text",
        type: "textarea",
        default: "Agreed — let's tighten that to ~0.6s and re-export.",
      },
      { key: "timestampLabel", label: "Timestamp", type: "text", default: "00:12" },
      { key: "isReply", label: "Render as reply", type: "boolean", default: true },
      { key: "link", label: "Conversation link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderNewCommentEmail({
        actorName: str(v, "actorName", "Jamie Chen"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        content: str(
          v,
          "content",
          "Agreed — let's tighten that to ~0.6s and re-export.",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "00:12"),
        isReply: bool(v, "isReply", true),
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "public-comment",
    label: "Public Comment",
    description:
      "Sent when a viewer on a shared review link leaves a comment.",
    fields: [
      { key: "authorName", label: "Author name", type: "text", default: "Sam Rivera" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "content",
        label: "Comment text",
        type: "textarea",
        default:
          "Color in the wheelhouse looks a little cool to me — could we warm it up slightly?",
      },
      { key: "timestampLabel", label: "Timestamp", type: "text", default: "01:43" },
      { key: "isReply", label: "Render as reply", type: "boolean", default: false },
      { key: "link", label: "Review link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderPublicCommentEmail({
        authorName: str(v, "authorName", "Sam Rivera"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        content: str(
          v,
          "content",
          "Color in the wheelhouse looks a little cool to me — could we warm it up slightly?",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "01:43"),
        isReply: bool(v, "isReply", false),
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "public-comment-reply",
    label: "Public Comment (Reply)",
    description: "Reply from a shared-link viewer.",
    fields: [
      { key: "authorName", label: "Author name", type: "text", default: "Sam Rivera" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "content",
        label: "Reply text",
        type: "textarea",
        default: "Thanks — that warmer pass looks great.",
      },
      { key: "timestampLabel", label: "Timestamp", type: "text", default: "01:43" },
      { key: "isReply", label: "Render as reply", type: "boolean", default: true },
      { key: "link", label: "Review link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderPublicCommentEmail({
        authorName: str(v, "authorName", "Sam Rivera"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        content: str(
          v,
          "content",
          "Thanks — that warmer pass looks great.",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "01:43"),
        isReply: bool(v, "isReply", true),
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "comment-resolved",
    label: "Comment Resolved",
    description: "Sent when a comment a user left is marked resolved.",
    fields: [
      { key: "recipientName", label: "Recipient name", type: "text", default: "Alex Morgan" },
      { key: "resolverName", label: "Resolver name", type: "text", default: "Jamie Chen" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "originalComment",
        label: "Original comment",
        type: "textarea",
        default:
          "Can we trim the boat shot by about a second before the title hits?",
      },
      { key: "timestampLabel", label: "Timestamp", type: "text", default: "00:12" },
      { key: "link", label: "Comment link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderCommentResolvedEmail({
        recipientName: str(v, "recipientName", "Alex Morgan"),
        resolverName: str(v, "resolverName", "Jamie Chen"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        originalComment: str(
          v,
          "originalComment",
          "Can we trim the boat shot by about a second before the title hits?",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "00:12"),
        resolutionNote: null,
        link: str(v, "link", COMMON.link),
      }),
  },
  {
    id: "comment-resolved-with-note",
    label: "Comment Resolved (with note)",
    description: "Resolved variant including an optional resolution note.",
    fields: [
      { key: "recipientName", label: "Recipient name", type: "text", default: "Alex Morgan" },
      { key: "resolverName", label: "Resolver name", type: "text", default: "Jamie Chen" },
      { key: "projectName", label: "Project name", type: "text", default: COMMON.projectName },
      { key: "deliverableTitle", label: "Deliverable title", type: "text", default: COMMON.deliverableTitle },
      {
        key: "originalComment",
        label: "Original comment",
        type: "textarea",
        default:
          "Can we trim the boat shot by about a second before the title hits?",
      },
      { key: "timestampLabel", label: "Timestamp", type: "text", default: "00:12" },
      {
        key: "resolutionNote",
        label: "Resolution note",
        type: "textarea",
        default:
          "Trimmed to 0.6s and re-exported. New cut uploaded as v3 — ready for another look.",
      },
      { key: "link", label: "Comment link", type: "text", default: COMMON.link },
    ],
    render: (v) =>
      renderCommentResolvedEmail({
        recipientName: str(v, "recipientName", "Alex Morgan"),
        resolverName: str(v, "resolverName", "Jamie Chen"),
        projectName: str(v, "projectName", COMMON.projectName),
        deliverableTitle: str(v, "deliverableTitle", COMMON.deliverableTitle),
        originalComment: str(
          v,
          "originalComment",
          "Can we trim the boat shot by about a second before the title hits?",
        ),
        timestampLabel: strOrNull(v, "timestampLabel", "00:12"),
        resolutionNote: str(
          v,
          "resolutionNote",
          "Trimmed to 0.6s and re-exported. New cut uploaded as v3 — ready for another look.",
        ),
        link: str(v, "link", COMMON.link),
      }),
  },
];

function templateSummary(p: PreviewDef) {
  return {
    id: p.id,
    label: p.label,
    description: p.description,
    fields: p.fields,
  };
}

function parseValuesFromQuery(
  query: Record<string, unknown>,
  fields: FieldDef[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = query[f.key];
    if (raw === undefined) continue;
    if (f.type === "boolean") {
      if (typeof raw === "string") {
        out[f.key] = raw === "true" || raw === "1";
      } else if (typeof raw === "boolean") {
        out[f.key] = raw;
      }
    } else if (typeof raw === "string") {
      out[f.key] = raw;
    }
  }
  return out;
}

router.get(
  "/admin/email-previews",
  requireRole("owner", "partner"),
  (_req, res) => {
    res.json({
      templates: PREVIEWS.map(templateSummary),
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

    const values = parseValuesFromQuery(
      req.query as Record<string, unknown>,
      preview.fields,
    );
    const html = preview.render(values);

    if (req.query.format === "html") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.send(html);
      return;
    }

    res.json({
      ...templateSummary(preview),
      html,
    });
  },
);

export default router;
