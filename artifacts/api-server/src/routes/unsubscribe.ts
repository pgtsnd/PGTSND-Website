import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "../lib/unsubscribe-token";
import { logger } from "../lib/logger";

const router = Router();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

router.get("/unsubscribe/dormant-tokens", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const verified = verifyUnsubscribeToken("dormant-tokens", token);
  if (!verified) {
    res
      .status(400)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(
        renderPage(
          "Invalid or expired link",
          "<p>This unsubscribe link couldn't be verified. Sign in and update your email preferences from the Notifications settings page.</p>",
        ),
      );
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

    res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(
        renderPage(
          "You're unsubscribed",
          `<p>You will no longer receive the weekly dormant access-token summary at <strong style="color:#fff;">${escapeHtml(user.email)}</strong>.</p>
           <p style="margin-top:16px;">You can re-enable this email any time from <a href="/team/settings?section=notifications" style="color:#fff;text-decoration:underline;">Notifications settings</a>. Other administrative emails are unaffected.</p>`,
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

export default router;
