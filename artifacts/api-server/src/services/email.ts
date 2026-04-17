import { logger } from "../lib/logger";

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface SendEmailParams {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

const RESEND_API_URL = "https://api.resend.com/emails";

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "PGTSND <notifications@pgtsndproductions.com>";
}

export type SendEmailResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: "no-api-key" }
  | { ok: false; status?: number; error: string };

export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  const toList = Array.isArray(params.to) ? params.to : [params.to];
  const ccList = params.cc
    ? Array.isArray(params.cc)
      ? params.cc
      : [params.cc]
    : [];

  if (!apiKey) {
    logger.info(
      { to: toList, cc: ccList, subject: params.subject },
      "Email send skipped (RESEND_API_KEY not configured)",
    );
    return { ok: true, skipped: true, reason: "no-api-key" };
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
        to: toList,
        ...(ccList.length > 0 ? { cc: ccList } : {}),
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
        { status: res.status, body, to: toList, cc: ccList, subject: params.subject },
        "Email send failed",
      );
      return {
        ok: false,
        status: res.status,
        error: body || `Email provider returned ${res.status}`,
      };
    }

    logger.info({ to: toList, cc: ccList, subject: params.subject }, "Email sent");
    return { ok: true };
  } catch (err) {
    logger.error({ err, to: toList, cc: ccList }, "Email send error");
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email send error",
    };
  }
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "http://localhost:5000"
  );
}
