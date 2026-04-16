import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export const CSRF_COOKIE_NAME = "pgtsnd_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATH_PREFIXES = [
  "/api/webhooks/",
  "/api/auth/google/callback",
];

const cookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function isExempt(req: Request): boolean {
  const path = req.originalUrl.split("?")[0];
  return EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let token: string | undefined = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, cookieOptions);
  }

  if (SAFE_METHODS.has(req.method) || isExempt(req)) {
    next();
    return;
  }

  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!headerToken || !timingSafeEqual(headerToken, token)) {
    res.status(403).json({ error: "Invalid or missing CSRF token" });
    return;
  }

  next();
}
