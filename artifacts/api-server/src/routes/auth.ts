import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import {
  createMagicLink,
  verifyMagicLink,
  findOrCreateGoogleUser,
  signToken,
  verifyToken,
  getDashboardPath,
  DEMO_EMAIL,
  ensureDemoUser,
  ensureDemoUserForToken,
} from "../lib/auth";
import {
  findActiveAccessTokenByPlaintext,
  isAccessTokenActive,
  markAccessTokenUsed,
} from "../lib/access-tokens";
import { logger } from "../lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const authRateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    error: "Too many attempts. Please wait a minute and try again.",
  });
};

const magicLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: authRateLimitHandler,
});

const perEmailRateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    error: "Too many magic link requests for this email. Please wait a few minutes and try again.",
  });
};

const magicLinkEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: perEmailRateLimitHandler,
  keyGenerator: (req: Request) => {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    return `magic-link-email:${rawEmail.toLowerCase().trim()}`;
  },
  skip: (req: Request) => {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
    const normalized = rawEmail.toLowerCase().trim();
    return !normalized || normalized === DEMO_EMAIL;
  },
});

const googleAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: authRateLimitHandler,
});

const COOKIE_NAME = "pgtsnd_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

router.post("/auth/magic-link", magicLinkLimiter, magicLinkEmailLimiter, async (req: Request, res: Response) => {
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

    if (process.env.NODE_ENV === "development") {
      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, normalizedEmail))
        .limit(1);

      if (existingUser) {
        const token = signToken({ userId: existingUser.id, email: existingUser.email, role: existingUser.role });
        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
        res.json({ success: true, demo: true, redirect: getDashboardPath(existingUser.role) });
        return;
      }
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

const accessTokenLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: authRateLimitHandler,
});

router.post(
  "/auth/access-token-login",
  accessTokenLoginLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, token: accessToken } = req.body ?? {};
      if (!accessToken || typeof accessToken !== "string") {
        res.status(400).json({ error: "Access token is required" });
        return;
      }

      const demoUser = await ensureDemoUserForToken(accessToken);
      if (demoUser) {
        const jwtToken = signToken({
          userId: demoUser.id,
          email: demoUser.email,
          role: demoUser.role,
        });
        res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);
        res.json({
          success: true,
          demo: true,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            avatarUrl: demoUser.avatarUrl,
          },
          redirect: getDashboardPath(demoUser.role),
        });
        return;
      }

      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Email and access token are required" });
        return;
      }

      const found = await findActiveAccessTokenByPlaintext(accessToken, email);
      if (!found) {
        res.status(401).json({ error: "Invalid email or access token" });
        return;
      }

      await markAccessTokenUsed(found.tokenId);

      const jwtToken = signToken({
        userId: found.userId,
        email: found.userEmail,
        role: found.userRole,
        tokenId: found.tokenId,
      });
      res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);
      res.json({
        success: true,
        user: {
          id: found.userId,
          email: found.userEmail,
          name: found.userName,
          role: found.userRole,
          avatarUrl: found.userAvatarUrl,
        },
        redirect: getDashboardPath(found.userRole),
      });
    } catch (err) {
      logger.error({ err }, "Access token login failed");
      res.status(500).json({ error: "Failed to sign in with access token" });
    }
  },
);

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

router.get("/auth/google", googleAuthLimiter, (_req: Request, res: Response) => {
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

router.get("/auth/me", async (req: Request, res: Response) => {
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

  if (payload.tokenId) {
    const stillActive = await isAccessTokenActive(payload.tokenId);
    if (!stillActive) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({ error: "Access token revoked" });
      return;
    }
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

  if (!user) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

export default router;
