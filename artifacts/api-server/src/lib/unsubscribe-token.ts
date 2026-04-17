import crypto from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.JWT_SECRET ||
  "dev-jwt-secret-change-in-production";

export type UnsubscribeKind = "dormant-tokens";

export const UNSUBSCRIBE_TOKEN_TTL_DAYS = 90;
const DEFAULT_TTL_MS = UNSUBSCRIBE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
// Tolerate small clock skew between issuer and verifier (5 minutes).
const FUTURE_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

function configuredTtlMs(): number {
  const raw = process.env.UNSUBSCRIBE_TOKEN_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TTL_MS;
  return Math.floor(n);
}

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

export interface VerifyUnsubscribeTokenOptions {
  /** Override "now" (ms since epoch). Intended for tests. */
  now?: number;
  /** Override the max-age for tokens (ms). Intended for tests. */
  ttlMs?: number;
}

function resolveCreateOpts(
  arg: Date | CreateUnsubscribeTokenOptions | undefined,
): CreateUnsubscribeTokenOptions {
  if (!arg) return {};
  if (arg instanceof Date) return { issuedAt: arg.getTime() };
  return arg;
}

function resolveVerifyOpts(
  arg: Date | VerifyUnsubscribeTokenOptions | undefined,
): VerifyUnsubscribeTokenOptions {
  if (!arg) return {};
  if (arg instanceof Date) return { now: arg.getTime() };
  return arg;
}

export function createUnsubscribeToken(
  kind: UnsubscribeKind,
  userId: string,
  optsOrIssuedAt: Date | CreateUnsubscribeTokenOptions = {},
): string {
  const opts = resolveCreateOpts(optsOrIssuedAt);
  const iat = Math.floor(opts.issuedAt ?? Date.now());
  const payload = `${kind}:${userId}:${iat}`;
  const body = b64url(Buffer.from(payload, "utf8"));
  const sig = sign(payload);
  return `${body}.${sig}`;
}

export function verifyUnsubscribeToken(
  kind: UnsubscribeKind,
  token: string,
  optsOrNow: Date | VerifyUnsubscribeTokenOptions = {},
): { userId: string; issuedAt: Date } | null {
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

  // Tokens must include an issued-at component. Legacy `kind:userId` tokens
  // (without an iat) are rejected so they can't bypass the expiry window.
  const parts = payload.split(":");
  if (parts.length !== 3) return null;
  const [k, userId, iatStr] = parts;
  if (k !== kind || !userId || !iatStr) return null;

  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || iat <= 0) return null;

  const opts = resolveVerifyOpts(optsOrNow);
  const now = opts.now ?? Date.now();
  const ttl = opts.ttlMs ?? configuredTtlMs();
  // Reject tokens issued in the far future (clock skew tolerance).
  if (iat - now > FUTURE_SKEW_TOLERANCE_MS) return null;
  if (now - iat > ttl) return null;

  return { userId, issuedAt: new Date(iat) };
}
