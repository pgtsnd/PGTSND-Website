import { logger } from "../lib/logger";

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

const RESEND_API_URL = "https://api.resend.com/emails";

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "PGTSND <notifications@pgtsndproductions.com>";
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info(
      { to: params.to, subject: params.subject },
      "Email send skipped (RESEND_API_KEY not configured)",
    );
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [params.to],
        subject: params.subject,
        text: params.text,
        html: params.html ?? params.text.replace(/\n/g, "<br/>"),
        ...(params.attachments && params.attachments.length > 0
          ? {
              attachments: params.attachments.map((a) => ({
                filename: a.filename,
                content: a.content,
                content_type: a.contentType,
              })),
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(
        { status: res.status, body, to: params.to, subject: params.subject },
        "Email send failed",
      );
      return;
    }

    logger.info({ to: params.to, subject: params.subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to: params.to }, "Email send error");
  }
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "http://localhost:5000"
  );
}
