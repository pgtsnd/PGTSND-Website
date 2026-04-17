import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  renderReviewReadyEmail,
  renderNewCommentEmail,
  renderPublicCommentEmail,
  renderCommentResolvedEmail,
  renderDormantTokensSummaryEmail,
} from "../services/email-templates";
import { sendEmail } from "../services/email";
import { logger } from "../lib/logger";

const router = Router();

type PreviewId =
  | "review-ready"
  | "new-comment"
  | "new-comment-reply"
  | "public-comment"
  | "public-comment-reply"
  | "comment-resolved"
  | "comment-resolved-with-note"
  | "dormant-tokens-summary";

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
  subject: string;
  text: string;
  render: (values: Record<string, unknown>) => string;
}

const SAMPLE_LINK = "https://pgtsnd.example.com/client-hub/review?d=sample";
const SAMPLE_PROJECT = "Bering Sea Crabbers — Season 3 Sizzle";
const SAMPLE_DELIVERABLE = "Hero Cut v2";

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
  projectName: SAMPLE_PROJECT,
  deliverableTitle: SAMPLE_DELIVERABLE,
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
    subject: `New cut ready for review: ${SAMPLE_DELIVERABLE}`,
    text:
      `Hi Alex,\n\nA new cut for "${SAMPLE_PROJECT}" is ready for your review.\n\n` +
      `Title: ${SAMPLE_DELIVERABLE}\nOpen the review page: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `New comment on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Jamie Chen left a comment at 00:12 on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}):\n\n` +
      `"Love the opening montage! Can we trim the boat shot by about a second?"\n\n` +
      `View the conversation: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `New reply on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Jamie Chen left a reply on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}):\n\n` +
      `"Agreed — let's tighten that to ~0.6s and re-export."\n\n` +
      `View the conversation: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `Public comment on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Sam Rivera (via shared review link) left a comment at 01:43 on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}):\n\n` +
      `"Color in the wheelhouse looks a little cool to me — could we warm it up slightly?"\n\n` +
      `View the review: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `Public reply on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Sam Rivera (via shared review link) left a reply on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}):\n\n` +
      `"Thanks — that warmer pass looks great."\n\n` +
      `View the review: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `Resolved: your comment on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Hi Alex,\n\nJamie Chen marked your comment at 00:12 on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}) as resolved.\n\n` +
      `View the resolved thread: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
    subject: `Resolved: your comment on "${SAMPLE_DELIVERABLE}"`,
    text:
      `Hi Alex,\n\nJamie Chen marked your comment at 00:12 on "${SAMPLE_DELIVERABLE}" (${SAMPLE_PROJECT}) as resolved.\n\n` +
      `Resolution note:\n"Trimmed to 0.6s and re-exported. New cut uploaded as v3 — ready for another look."\n\n` +
      `View the resolved thread: ${SAMPLE_LINK}\n\n— PGTSND Productions`,
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
  {
    id: "dormant-tokens-summary",
    label: "Dormant Tokens Weekly Summary",
    description:
      "Sent weekly to owners listing active access tokens that have been unused for 90+ days.",
    fields: [
      { key: "recipientName", label: "Recipient name", type: "text", default: "Alex Morgan" },
      { key: "thresholdDays", label: "Dormant threshold (days)", type: "text", default: "90" },
      { key: "link", label: "Access page link", type: "text", default: "https://pgtsnd.example.com/team/access" },
    ],
    subject: "Weekly access-token review: 3 dormant tokens",
    text:
      `3 active access tokens have not been used in over 90 days:\n\n` +
      `- Sam Rivera <sam@example.com> — "Editor laptop" — 2025-09-12 (217d ago)\n` +
      `- Jamie Chen <jamie@example.com> — "Old CI runner" — Never used · created 2025-08-04 (256d ago)\n` +
      `- Riley Park <riley@example.com> — "Backup script" — 2025-10-02 (197d ago)\n\n` +
      `Review and revoke at: https://pgtsnd.example.com/team/access\n\n— PGTSND Productions`,
    render: (v) => {
      const thresholdRaw = str(v, "thresholdDays", "90");
      const threshold = Number.parseInt(thresholdRaw, 10);
      return renderDormantTokensSummaryEmail({
        recipientName: str(v, "recipientName", "Alex Morgan"),
        thresholdDays:
          Number.isFinite(threshold) && threshold > 0 ? threshold : 90,
        tokens: [
          {
            userName: "Sam Rivera",
            userEmail: "sam@example.com",
            label: "Editor laptop",
            lastActivityLabel: "2025-09-12 (217d ago)",
          },
          {
            userName: "Jamie Chen",
            userEmail: "jamie@example.com",
            label: "Old CI runner",
            lastActivityLabel: "Never used · created 2025-08-04 (256d ago)",
          },
          {
            userName: "Riley Park",
            userEmail: "riley@example.com",
            label: "Backup script",
            lastActivityLabel: "2025-10-02 (197d ago)",
          },
        ],
        link: str(v, "link", "https://pgtsnd.example.com/team/access"),
      });
    },
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  "/admin/email-previews/:id/send",
  requireRole("owner", "partner"),
  async (req, res) => {
    const preview = PREVIEWS.find((p) => p.id === req.params.id);
    if (!preview) {
      res.status(404).json({ error: "Unknown email template" });
      return;
    }

    const recipient =
      typeof req.body?.recipient === "string" ? req.body.recipient.trim() : "";
    if (!recipient || !EMAIL_RE.test(recipient)) {
      res.status(400).json({ error: "A valid recipient email is required" });
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      res.status(503).json({
        error:
          "Email service is not configured. Set RESEND_API_KEY to send test emails.",
      });
      return;
    }

    const values =
      typeof req.body?.values === "object" && req.body.values !== null
        ? (req.body.values as Record<string, unknown>)
        : {};

    try {
      const result = await sendEmail({
        to: recipient,
        subject: `[TEST] ${preview.subject}`,
        text: preview.text,
        html: preview.render(values),
      });

      if (!result.ok) {
        res.status(502).json({
          error: `Email provider rejected the send: ${result.error}`,
        });
        return;
      }

      if ("skipped" in result && result.skipped) {
        // Defensive — RESEND_API_KEY presence was already checked above, but
        // if email.ts ever skips for another reason, surface it instead of
        // silently reporting success.
        res.status(503).json({
          error: "Email service did not dispatch the message.",
        });
        return;
      }

      logger.info(
        { templateId: preview.id, to: recipient },
        "Test email dispatched from preview screen",
      );
      res.json({ ok: true, recipient });
    } catch (err) {
      logger.error({ err, templateId: preview.id }, "Test email send failed");
      res.status(500).json({ error: "Failed to send test email" });
    }
  },
);

export default router;
