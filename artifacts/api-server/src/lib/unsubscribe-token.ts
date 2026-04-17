import crypto from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.JWT_SECRET ||
  "dev-jwt-secret-change-in-production";

const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function configuredTtlMs(): number {
  const raw = process.env.UNSUBSCRIBE_TOKEN_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TTL_MS;
  return Math.floor(n);
}

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

export interface CreateUnsubscribeTokenOptions {
  /** Override the issued-at timestamp (ms since epoch). Intended for tests. */
  issuedAt?: number;
}

export function createUnsubscribeToken(
  kind: UnsubscribeKind,
  userId: string,
  opts: CreateUnsubscribeTokenOptions = {},
): string {
  const iat = Math.floor(opts.issuedAt ?? Date.now());
  const payload = `${kind}:${userId}:${iat}`;
  const body = b64url(Buffer.from(payload, "utf8"));
  const sig = sign(payload);
  return `${body}.${sig}`;
}

export interface VerifyUnsubscribeTokenOptions {
  /** Override "now" (ms since epoch). Intended for tests. */
  now?: number;
  /** Override the max-age for tokens (ms). Intended for tests. */
  ttlMs?: number;
}

export function verifyUnsubscribeToken(
  kind: UnsubscribeKind,
  token: string,
  opts: VerifyUnsubscribeTokenOptions = {},
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
  const parts = payload.split(":");
  if (parts.length !== 3) return null;
  const [k, userId, iatStr] = parts;
  if (k !== kind || !userId || !iatStr) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || iat <= 0) return null;
  const now = opts.now ?? Date.now();
  const ttl = opts.ttlMs ?? configuredTtlMs();
  // Reject tokens issued in the far future (clock skew tolerance: 5 minutes).
  if (iat - now > 5 * 60 * 1000) return null;
  if (now - iat > ttl) return null;
  return { userId };
}
