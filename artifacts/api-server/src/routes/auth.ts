import { Router, type IRouter, type Request, type Response } from "express";
import {
  createMagicLink,
  verifyMagicLink,
  findOrCreateGoogleUser,
  signToken,
  verifyToken,
  getDashboardPath,
  DEMO_EMAIL,
  ensureDemoUser,
} from "../lib/auth";
import { logger } from "../lib/logger";
import { db, usersTable, selectUserSchema } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { validateAndSend } from "../middleware/validate-response";

const router: IRouter = Router();

const COOKIE_NAME = "pgtsnd_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

router.post("/auth/magic-link", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === DEMO_EMAIL) {
      const user = await ensureDemoUser();
      const token = signToken({ userId: user.id, email: user.email, role: user.role });
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      res.json({ success: true, demo: true, redirect: getDashboardPath(user.role) });
      return;
    }

    const magicToken = await createMagicLink(normalizedEmail);

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:3000"}`;
    const magicLinkUrl = `${baseUrl}/auth/verify?token=${magicToken}`;

    logger.info({ email: normalizedEmail, magicLinkUrl }, "Magic link generated");

    res.json({ success: true, message: "Magic link sent to your email" });
  } catch (err) {
    logger.error({ err }, "Failed to send magic link");
    res.status(500).json({ error: "Failed to send magic link" });
  }
});

router.get("/auth/verify-magic-link", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const user = await verifyMagicLink(token);

    if (!user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const jwtToken = signToken({ userId: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
      redirect: getDashboardPath(user.role),
    });
  } catch (err) {
    logger.error({ err }, "Failed to verify magic link");
    res.status(500).json({ error: "Failed to verify magic link" });
  }
});

router.get("/auth/google", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  const redirectUri = `${process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:3000"}`}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.json({ url });
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Authorization code required" });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ error: "Google OAuth not configured" });
      return;
    }

    const redirectUri = `${process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:3000"}`}/api/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      logger.error({ tokenData }, "Failed to get Google access token");
      res.status(401).json({ error: "Failed to authenticate with Google" });
      return;
    }

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json() as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    const user = await findOrCreateGoogleUser({
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.id,
      avatarUrl: userInfo.picture,
    });

    const jwtToken = signToken({ userId: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost:3000"}`;
    res.redirect(`${baseUrl}${getDashboardPath(user.role)}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    res.status(500).json({ error: "Google authentication failed" });
  }
});

router.get("/auth/me", (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  res.json({
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.email, email.toLowerCase().trim()),
        ne(usersTable.role, "client"),
      ),
    )
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Access restricted to team members" });
    return;
  }

  validateAndSend(res, selectUserSchema, user);
});

export default router;
