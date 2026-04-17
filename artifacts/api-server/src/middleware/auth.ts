import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { isAccessTokenActive } from "../lib/access-tokens";

const COOKIE_NAME = "pgtsnd_session";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: "owner" | "partner" | "crew" | "client";
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let userId: string | undefined;
  let tokenId: string | undefined;

  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      userId = payload.userId;
      tokenId = payload.tokenId;
    }
  }

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (tokenId) {
    const stillActive = await isAccessTokenActive(tokenId);
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
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: Array<"owner" | "partner" | "crew" | "client">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
