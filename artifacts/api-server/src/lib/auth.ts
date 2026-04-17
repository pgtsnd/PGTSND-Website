import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, magicLinkTokensTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const MAGIC_LINK_EXPIRES_MINUTES = 15;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createMagicLink(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();

  let user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .then((rows) => rows[0]);

  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({ email: normalizedEmail, role: "client" })
      .returning();
    user = newUser;
  }

  const token = generateMagicLinkToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);

  await db.insert(magicLinkTokensTable).values({
    token,
    email: normalizedEmail,
    userId: user.id,
    expiresAt,
  });

  return token;
}

export async function verifyMagicLink(token: string) {
  const [record] = await db
    .select()
    .from(magicLinkTokensTable)
    .where(
      and(
        eq(magicLinkTokensTable.token, token),
        eq(magicLinkTokensTable.used, false),
      ),
    );

  if (!record) {
    return null;
  }

  if (new Date() > record.expiresAt) {
    return null;
  }

  await db
    .update(magicLinkTokensTable)
    .set({ used: true })
    .where(eq(magicLinkTokensTable.id, record.id));

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, record.email));

  if (!user) {
    return null;
  }

  return user;
}

export async function findOrCreateGoogleUser(profile: {
  email: string;
  name?: string;
  googleId: string;
  avatarUrl?: string;
}) {
  const normalizedEmail = profile.email.toLowerCase().trim();

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (user) {
    if (!user.googleId) {
      await db
        .update(usersTable)
        .set({
          googleId: profile.googleId,
          name: profile.name || user.name,
          avatarUrl: profile.avatarUrl || user.avatarUrl,
        })
        .where(eq(usersTable.id, user.id));
      user = { ...user, googleId: profile.googleId, name: profile.name || user.name || null };
    }
    return user;
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      email: normalizedEmail,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      role: "client",
    })
    .returning();

  return newUser;
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "owner":
    case "partner":
    case "crew":
      return "/team/dashboard";
    case "client":
    default:
      return "/client-hub/dashboard";
  }
}

export const DEMO_EMAIL = "demo@pgtsnd.com";

export async function ensureDemoUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL));

  if (existing) return existing;

  const [user] = await db
    .insert(usersTable)
    .values({
      email: DEMO_EMAIL,
      name: "Demo User",
      role: "owner",
    })
    .returning();

  logger.info("Created demo user");
  return user;
}

export const DEMO_TOKENS: Record<
  string,
  { email: string; name: string; role: "owner" | "crew" | "client" }
> = {
  "DEMO-OWNER-2026": {
    email: "owner@demo.pgtsnd.com",
    name: "Demo Owner",
    role: "owner",
  },
  "DEMO-CREW-2026": {
    email: "crew@demo.pgtsnd.com",
    name: "Demo Crew",
    role: "crew",
  },
  "DEMO-CLIENT-2026": {
    email: "client@demo.pgtsnd.com",
    name: "Demo Client",
    role: "client",
  },
};

export async function ensureDemoUserForToken(token: string) {
  const config = DEMO_TOKENS[token.trim().toUpperCase()];
  if (!config) return null;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, config.email));

  if (existing) {
    if (existing.role !== config.role || existing.name !== config.name) {
      const [pinned] = await db
        .update(usersTable)
        .set({ role: config.role, name: config.name })
        .where(eq(usersTable.id, existing.id))
        .returning();
      return pinned;
    }
    return existing;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email: config.email,
      name: config.name,
      role: config.role,
    })
    .returning();

  logger.info({ role: config.role }, "Created demo role user");
  return user;
}
