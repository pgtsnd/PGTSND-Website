import crypto from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.JWT_SECRET ||
  "dev-jwt-secret-change-in-production";

export type UnsubscribeKind = "dormant-tokens";

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(payload).digest());
}

export function createUnsubscribeToken(
  kind: UnsubscribeKind,
  userId: string,
): string {
  const payload = `${kind}:${userId}`;
  const body = b64url(Buffer.from(payload, "utf8"));
  const sig = sign(payload);
  return `${body}.${sig}`;
}

export function verifyUnsubscribeToken(
  kind: UnsubscribeKind,
  token: string,
): { userId: string } | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let payload: string;
  try {
    payload = fromB64url(body).toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const idx = payload.indexOf(":");
  if (idx < 0) return null;
  const k = payload.slice(0, idx);
  const userId = payload.slice(idx + 1);
  if (k !== kind || !userId) return null;
  return { userId };
}
