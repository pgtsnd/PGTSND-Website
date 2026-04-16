/**
 * On-brand HTML email templates for PGTSND Productions notifications.
 *
 * Design goals:
 * - Dark PGTSND palette (black background, white text, subtle neutral greys).
 * - Montserrat with a sensible sans-serif fallback chain for clients that
 *   strip webfonts.
 * - Single prominent call-to-action button.
 * - Inline styles only (email-client safe; no external stylesheets).
 */

const BRAND = {
  bg: "#0a0a0a",
  card: "#141414",
  border: "#262626",
  text: "#ffffff",
  muted: "#a3a3a3",
  subtle: "#737373",
  accent: "#ffffff",
  accentText: "#000000",
  quoteBar: "#404040",
};

const FONT_STACK =
  "'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(input: string): string {
  return escapeHtml(input).replace(/\n/g, "<br/>");
}

interface LayoutOptions {
  previewText: string;
  heading: string;
  intro: string;
  bodyHtml?: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}

function layout(opts: LayoutOptions): string {
  const preview = escapeHtml(opts.previewText);
  const heading = escapeHtml(opts.heading);
  const intro = escapeHtml(opts.intro);
  const ctaLabel = escapeHtml(opts.ctaLabel);
  const ctaUrl = escapeHtml(opts.ctaUrl);
  const footerNote = escapeHtml(
    opts.footerNote ??
      "You're receiving this because you're part of a PGTSND Productions project. Manage email preferences in your account settings.",
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:${FONT_STACK};color:${BRAND.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;">
            <tr>
              <td style="padding:28px 32px 20px 32px;border-bottom:1px solid ${BRAND.border};">
                <div style="font-family:${FONT_STACK};font-weight:700;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.muted};">
                  PGTSND Productions
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px 0;font-family:${FONT_STACK};font-weight:700;font-size:22px;line-height:1.3;color:${BRAND.text};">
                  ${heading}
                </h1>
                <p style="margin:0 0 20px 0;font-family:${FONT_STACK};font-weight:400;font-size:14px;line-height:1.6;color:${BRAND.muted};">
                  ${intro}
                </p>
                ${opts.bodyHtml ?? ""}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0;">
                  <tr>
                    <td style="border-radius:6px;background:${BRAND.accent};">
                      <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.accentText};text-decoration:none;border-radius:6px;">
                        ${ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-family:${FONT_STACK};font-weight:400;font-size:12px;line-height:1.6;color:${BRAND.subtle};">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${ctaUrl}" style="color:${BRAND.muted};text-decoration:underline;word-break:break-all;">${ctaUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px 32px;border-top:1px solid ${BRAND.border};">
                <p style="margin:0;font-family:${FONT_STACK};font-weight:400;font-size:11px;line-height:1.6;color:${BRAND.subtle};">
                  ${footerNote}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-family:${FONT_STACK};font-weight:400;font-size:11px;color:${BRAND.subtle};">
            &copy; PGTSND Productions
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface ReviewReadyTemplateInput {
  recipientName: string | null;
  projectName: string;
  deliverableTitle: string;
  link: string;
}

export function renderReviewReadyEmail(input: ReviewReadyTemplateInput): string {
  const name = input.recipientName?.trim() || "there";
  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;border:1px solid ${BRAND.border};border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:${FONT_STACK};font-weight:600;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.subtle};margin-bottom:6px;">Project</div>
          <div style="font-family:${FONT_STACK};font-weight:500;font-size:14px;color:${BRAND.text};margin-bottom:14px;">${escapeHtml(input.projectName)}</div>
          <div style="font-family:${FONT_STACK};font-weight:600;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.subtle};margin-bottom:6px;">Deliverable</div>
          <div style="font-family:${FONT_STACK};font-weight:500;font-size:14px;color:${BRAND.text};">${escapeHtml(input.deliverableTitle)}</div>
        </td>
      </tr>
    </table>`;

  return layout({
    previewText: `A new cut for ${input.projectName} is ready for your review.`,
    heading: "A new cut is ready for review",
    intro: `Hi ${name}, a fresh cut is ready for your feedback. Give it a watch and drop timestamped notes right in the review player.`,
    bodyHtml,
    ctaLabel: "Open Review",
    ctaUrl: input.link,
  });
}

export interface NewCommentTemplateInput {
  actorName: string;
  projectName: string;
  deliverableTitle: string;
  content: string;
  timestampLabel: string | null;
  isReply: boolean;
  link: string;
}

export function renderNewCommentEmail(input: NewCommentTemplateInput): string {
  const kind = input.isReply ? "reply" : "comment";
  const at = input.timestampLabel ? ` at ${input.timestampLabel}` : "";
  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;border:1px solid ${BRAND.border};border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:${FONT_STACK};font-weight:600;font-size:11px;color:${BRAND.muted};margin-bottom:10px;">
            ${escapeHtml(input.actorName)} &middot; ${escapeHtml(input.deliverableTitle)} &middot; ${escapeHtml(input.projectName)}
          </div>
          <div style="border-left:3px solid ${BRAND.quoteBar};padding:4px 0 4px 14px;font-family:${FONT_STACK};font-weight:400;font-size:14px;line-height:1.6;color:${BRAND.text};">
            ${nl2br(input.content)}
          </div>
        </td>
      </tr>
    </table>`;

  return layout({
    previewText: `${input.actorName} left a ${kind}${at} on ${input.deliverableTitle}.`,
    heading: `New ${kind}${at} on "${input.deliverableTitle}"`,
    intro: `${input.actorName} left a ${kind}${at} on "${input.deliverableTitle}" in ${input.projectName}.`,
    bodyHtml,
    ctaLabel: "View Conversation",
    ctaUrl: input.link,
  });
}

export interface PublicCommentTemplateInput {
  authorName: string;
  projectName: string;
  deliverableTitle: string;
  content: string;
  timestampLabel: string | null;
  isReply: boolean;
  link: string;
}

export function renderPublicCommentEmail(
  input: PublicCommentTemplateInput,
): string {
  const kind = input.isReply ? "reply" : "comment";
  const at = input.timestampLabel ? ` at ${input.timestampLabel}` : "";
  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;border:1px solid ${BRAND.border};border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:${FONT_STACK};font-weight:600;font-size:11px;color:${BRAND.muted};margin-bottom:4px;">
            ${escapeHtml(input.authorName)} <span style="color:${BRAND.subtle};font-weight:400;">(via shared link)</span>
          </div>
          <div style="font-family:${FONT_STACK};font-weight:400;font-size:11px;color:${BRAND.subtle};margin-bottom:10px;">
            ${escapeHtml(input.deliverableTitle)} &middot; ${escapeHtml(input.projectName)}
          </div>
          <div style="border-left:3px solid ${BRAND.quoteBar};padding:4px 0 4px 14px;font-family:${FONT_STACK};font-weight:400;font-size:14px;line-height:1.6;color:${BRAND.text};">
            ${nl2br(input.content)}
          </div>
        </td>
      </tr>
    </table>`;

  return layout({
    previewText: `${input.authorName} left a public ${kind}${at} on ${input.deliverableTitle}.`,
    heading: `New public ${kind} on "${input.deliverableTitle}"`,
    intro: `${input.authorName} (via shared review link) left a ${kind}${at} on "${input.deliverableTitle}" in ${input.projectName}.`,
    bodyHtml,
    ctaLabel: "View Review",
    ctaUrl: input.link,
  });
}
