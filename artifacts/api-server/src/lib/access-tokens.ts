import crypto from "crypto";
import { db } from "@workspace/db";
import { accessTokensTable, usersTable } from "@workspace/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";

const TOKEN_BYTE_LENGTH = 24;

const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function toBase32(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < buf.length; i += 1) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

export function generateAccessTokenString(): string {
  const buf = crypto.randomBytes(TOKEN_BYTE_LENGTH);
  const raw = toBase32(buf);
  return raw.match(/.{1,5}/g)!.slice(0, 8).join("-");
}

export function hashAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export interface CreateAccessTokenInput {
  userId: string;
  label: string;
  createdBy?: string | null;
  expiresAt?: Date | null;
}

export interface AccessTokenView {
  id: string;
  userId: string;
  label: string;
  status: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdBy: string | null;
  revokedBy: string | null;
  userName: string | null;
  userEmail: string;
  userRole: string;
}

export interface AccessTokenIssueResult {
  token: string;
  record: AccessTokenView;
}

export async function getAccessTokenView(
  tokenId: string,
): Promise<AccessTokenView | null> {
  const [row] = await db
    .select({
      id: accessTokensTable.id,
      userId: accessTokensTable.userId,
      label: accessTokensTable.label,
      status: accessTokensTable.status,
      createdAt: accessTokensTable.createdAt,
      expiresAt: accessTokensTable.expiresAt,
      lastUsedAt: accessTokensTable.lastUsedAt,
      revokedAt: accessTokensTable.revokedAt,
      createdBy: accessTokensTable.createdBy,
      revokedBy: accessTokensTable.revokedBy,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userRole: usersTable.role,
    })
    .from(accessTokensTable)
    .innerJoin(usersTable, eq(usersTable.id, accessTokensTable.userId))
    .where(eq(accessTokensTable.id, tokenId))
    .limit(1);
  return row ?? null;
}

export async function createAccessToken(
  input: CreateAccessTokenInput,
): Promise<AccessTokenIssueResult> {
  const token = generateAccessTokenString();
  const tokenHash = hashAccessToken(token);
  const [inserted] = await db
    .insert(accessTokensTable)
    .values({
      userId: input.userId,
      label: input.label,
      tokenHash,
      createdBy: input.createdBy ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning({ id: accessTokensTable.id });
  const view = await getAccessTokenView(inserted.id);
  if (!view) {
    throw new Error("Failed to load created access token");
  }
  return { token, record: view };
}

export async function findActiveAccessTokenByPlaintext(
  token: string,
  email?: string,
) {
  const tokenHash = hashAccessToken(token);

  const [row] = await db
    .select({
      tokenId: accessTokensTable.id,
      userId: accessTokensTable.userId,
      status: accessTokensTable.status,
      userEmail: usersTable.email,
      userRole: usersTable.role,
      userName: usersTable.name,
      userAvatarUrl: usersTable.avatarUrl,
    })
    .from(accessTokensTable)
    .innerJoin(usersTable, eq(usersTable.id, accessTokensTable.userId))
    .where(
      and(
        eq(accessTokensTable.tokenHash, tokenHash),
        eq(accessTokensTable.status, "active"),
        or(
          isNull(accessTokensTable.expiresAt),
          gt(accessTokensTable.expiresAt, new Date()),
        ),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (email && row.userEmail.toLowerCase() !== email.toLowerCase().trim()) {
    return null;
  }
  return row;
}

export async function markAccessTokenUsed(tokenId: string) {
  await db
    .update(accessTokensTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(accessTokensTable.id, tokenId));
}

export async function isAccessTokenActive(tokenId: string): Promise<boolean> {
  const [row] = await db
    .select({
      status: accessTokensTable.status,
      expiresAt: accessTokensTable.expiresAt,
    })
    .from(accessTokensTable)
    .where(eq(accessTokensTable.id, tokenId))
    .limit(1);
  if (!row || row.status !== "active") return false;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

export async function revokeAccessToken(
  tokenId: string,
  revokedBy?: string | null,
): Promise<AccessTokenView | null> {
  const [updated] = await db
    .update(accessTokensTable)
    .set({ status: "revoked", revokedAt: new Date(), revokedBy: revokedBy ?? null })
    .where(eq(accessTokensTable.id, tokenId))
    .returning({ id: accessTokensTable.id });
  if (!updated) return null;
  return getAccessTokenView(updated.id);
}
