import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeTokenExpiresAt,
  UNSUBSCRIBE_TOKEN_TTL_DAYS,
} from "../lib/unsubscribe-token";
import { logger } from "../lib/logger";
import { sendEmail, getAppBaseUrl } from "../services/email";

const router = Router();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatIssuedAt(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function renderPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Montserrat','Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
    <div style="max-width:520px;margin:64px auto;padding:32px;background:#141414;border:1px solid #262626;border-radius:8px;">
      <div style="font-weight:700;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#a3a3a3;margin-bottom:16px;">PGTSND Productions</div>
      <h1 style="margin:0 0 16px 0;font-weight:700;font-size:22px;line-height:1.3;">${title}</h1>
      <div style="font-size:14px;line-height:1.6;color:#a3a3a3;">${body}</div>
    </div>
  </body>
</html>`;
}

function renderExpiredLinkPage(): string {
  const body = `
    <p style="margin:0 0 16px 0;">This unsubscribe link couldn't be verified. For security, unsubscribe links expire about ${UNSUBSCRIBE_TOKEN_TTL_DAYS} days after they're issued, so an older email may no longer work.</p>
    <p style="margin:0 0 20px 0;">Enter the email address that received the original message and we'll send you a fresh one-click unsubscribe link.</p>
    <form method="POST" action="/api/unsubscribe/dormant-tokens/resend" style="margin:0;">
      <label for="email" style="display:block;font-weight:600;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a3a3a3;margin-bottom:8px;">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autocomplete="email"
        placeholder="you@example.com"
        style="display:block;width:100%;box-sizing:border-box;padding:12px 14px;font-family:inherit;font-size:14px;color:#ffffff;background:#0a0a0a;border:1px solid #404040;border-radius:6px;margin-bottom:16px;"
      />
      <button
        type="submit"
        style="display:inline-block;padding:12px 24px;font-family:inherit;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#000000;background:#ffffff;border:0;border-radius:6px;cursor:pointer;"
      >
        Send me a new unsubscribe link
      </button>
    </form>
    <p style="margin:20px 0 0 0;font-size:12px;color:#737373;">Already signed in? You can also update your email preferences from the <a href="/team/settings?section=notifications" style="color:#a3a3a3;text-decoration:underline;">Notifications settings</a> page.</p>
  `;
  return renderPage("Invalid or expired link", body);
}

router.get("/unsubscribe/dormant-tokens", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const verified = verifyUnsubscribeToken("dormant-tokens", token);
  if (!verified) {
    res
      .status(400)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(renderExpiredLinkPage());
    return;
  }

  try {
    const [user] = await db
      .update(usersTable)
      .set({
        emailNotifyDormantTokens: false,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: new Date(),
      })
      .where(eq(usersTable.id, verified.userId))
      .returning({ email: usersTable.email });

    if (!user) {
      res
        .status(404)
        .set("Content-Type", "text/html; charset=utf-8")
        .send(
          renderPage(
            "Account not found",
            "<p>We couldn't find the account for this unsubscribe link.</p>",
          ),
        );
      return;
    }

    logger.info(
      { userId: verified.userId },
      "User unsubscribed from dormant tokens summary via one-click link",
    );

    const issuedLine = verified.issuedAt
      ? `<p style="margin-top:16px;font-size:13px;color:#737373;">This unsubscribe link was issued on ${escapeHtml(formatIssuedAt(verified.issuedAt))}.</p>`
      : "";

    res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(
        renderPage(
          "You're unsubscribed",
          `<p>You will no longer receive the weekly dormant access-token summary at <strong style="color:#fff;">${escapeHtml(user.email)}</strong>.</p>
           <p style="margin-top:16px;">You can re-enable this email any time from <a href="/team/settings?section=notifications" style="color:#fff;text-decoration:underline;">Notifications settings</a>. Other administrative emails are unaffected.</p>${issuedLine}`,
        ),
      );
  } catch (err) {
    logger.error({ err }, "Failed to apply dormant-tokens unsubscribe");
    res
      .status(500)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(
        renderPage(
          "Something went wrong",
          "<p>We hit an unexpected error processing your unsubscribe. Please try again or update preferences in your account settings.</p>",
        ),
      );
  }
});

// One-click POST per RFC 8058 (List-Unsubscribe-Post). Accepts the same token
// in the query string and applies the same opt-out.
router.post("/unsubscribe/dormant-tokens", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const verified = verifyUnsubscribeToken("dormant-tokens", token);
  if (!verified) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }
  await db
    .update(usersTable)
    .set({
      emailNotifyDormantTokens: false,
      dormantTokensSnoozeUntil: null,
      dormantTokensUnsubscribedAt: new Date(),
    })
    .where(eq(usersTable.id, verified.userId));
  res.json({ ok: true });
});

// Renders the same generic confirmation regardless of whether the email is
// on file. This avoids leaking which addresses have accounts while still
// giving the recipient a clear "we've sent it if it exists" message.
function renderResendConfirmationPage(): string {
  return renderPage(
    "Check your inbox",
    `<p>If that email address is on file, we've just sent it a fresh one-click unsubscribe link.</p>
     <p style="margin-top:16px;">It should arrive within a minute or two. If you don't see it, check your spam folder or try again.</p>`,
  );
}

// Lets a recipient request a freshly-signed unsubscribe link when their old
// one has expired. Always returns a generic confirmation so we don't disclose
// which email addresses have accounts.
router.post("/unsubscribe/dormant-tokens/resend", async (req, res) => {
  const rawEmail =
    typeof req.body?.email === "string" ? req.body.email : "";
  const email = rawEmail.trim().toLowerCase();

  const respondOk = () => {
    res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(renderResendConfirmationPage());
  };

  if (!email || !email.includes("@")) {
    respondOk();
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      })
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email}`)
      .limit(1);

    if (!user) {
      logger.info(
        { emailHash: email.length },
        "Unsubscribe resend requested for unknown email",
      );
      respondOk();
      return;
    }

    const baseUrl = getAppBaseUrl().replace(/\/+$/, "");
    const issuedAt = Date.now();
    const unsubscribeToken = createUnsubscribeToken(
      "dormant-tokens",
      user.id,
      { issuedAt },
    );
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(unsubscribeToken)}`;
    const expiresAtLabel = formatIssuedAt(unsubscribeTokenExpiresAt(issuedAt));
    const managePreferencesUrl = `${baseUrl}/team/settings?section=notifications`;
    const name = user.name?.trim() || "there";

    const subject = "Your fresh PGTSND unsubscribe link";
    const text = [
      `Hi ${name},`,
      "",
      `You asked us to re-send your one-click unsubscribe link for the weekly dormant access-token summary. Click below to opt out — the link is valid until ${expiresAtLabel}:`,
      "",
      unsubscribeUrl,
      "",
      `Or manage all email preferences here: ${managePreferencesUrl}`,
      "",
      "If you didn't request this, you can safely ignore this email — nothing has changed on your account.",
      "",
      "— PGTSND Productions",
    ].join("\n");

    const html = renderPage(
      "Your fresh unsubscribe link",
      `<p>Hi ${escapeHtml(name)}, click the button below to unsubscribe from the weekly dormant access-token summary.</p>
       <p style="margin:24px 0;">
         <a href="${escapeHtml(unsubscribeUrl)}" style="display:inline-block;padding:12px 24px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#000000;background:#ffffff;text-decoration:none;border-radius:6px;">Unsubscribe in one click</a>
       </p>
       <p style="margin:0 0 8px 0;font-size:12px;color:#a3a3a3;">Valid until ${escapeHtml(expiresAtLabel)}.</p>
       <p style="font-size:12px;color:#737373;word-break:break-all;">If the button doesn't work, copy this link into your browser:<br/><a href="${escapeHtml(unsubscribeUrl)}" style="color:#a3a3a3;text-decoration:underline;">${escapeHtml(unsubscribeUrl)}</a></p>
       <p style="margin-top:20px;font-size:12px;color:#737373;">If you didn't request this, you can safely ignore this email — nothing has changed on your account. You can also <a href="${escapeHtml(managePreferencesUrl)}" style="color:#a3a3a3;text-decoration:underline;">manage all email preferences</a>.</p>`,
    );

    const result = await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });

    if (!result.ok) {
      logger.error(
        { userId: user.id, error: result.error },
        "Failed to send fresh unsubscribe link email",
      );
    } else {
      logger.info(
        { userId: user.id },
        "Sent fresh unsubscribe link to verified address on file",
      );
    }
  } catch (err) {
    logger.error({ err }, "Unsubscribe resend handler threw");
  }

  respondOk();
});

export default router;
