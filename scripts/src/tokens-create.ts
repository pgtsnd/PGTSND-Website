import crypto from "crypto";
import { db, accessTokensTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TOKEN_BYTE_LENGTH = 24;

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

function generateAccessTokenString(): string {
  const buf = crypto.randomBytes(TOKEN_BYTE_LENGTH);
  const raw = toBase32(buf);
  return raw.match(/.{1,5}/g)!.slice(0, 8).join("-");
}

function hashAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

function getArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const email = getArg("email");
  const label = getArg("label") ?? "CLI-issued";
  if (!email) {
    console.error(
      "Usage: pnpm tokens:create --email user@example.com [--label \"reason\"]",
    );
    process.exit(2);
  }
  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);
  if (!user) {
    console.error(`No user found with email ${normalizedEmail}`);
    process.exit(1);
  }
  const token = generateAccessTokenString();
  const tokenHash = hashAccessToken(token);
  const [record] = await db
    .insert(accessTokensTable)
    .values({ userId: user.id, label, tokenHash, createdBy: null })
    .returning({ id: accessTokensTable.id, createdAt: accessTokensTable.createdAt });

  console.log("Access token issued");
  console.log("------------------------------------------------------------");
  console.log(`User:       ${user.email} (${user.role})`);
  console.log(`Label:      ${label}`);
  console.log(`Token ID:   ${record.id}`);
  console.log(`Created:    ${record.createdAt.toISOString()}`);
  console.log("");
  console.log(`TOKEN:      ${token}`);
  console.log("");
  console.log("Hand this token to the recipient out-of-band. It will NOT be");
  console.log("retrievable again. Revoke from /team/access if compromised.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create access token:", err);
  process.exit(1);
});
