import crypto from "crypto";
import { db, accessTokensTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

function hashAccessToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

function getArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const token = getArg("token");
  const email = getArg("email");
  if (!token || !email) {
    console.error(
      "Usage: pnpm tokens:verify --email user@example.com --token XXXXX-...",
    );
    process.exit(2);
  }
  const tokenHash = hashAccessToken(token);
  const normalizedEmail = email.toLowerCase().trim();

  const [row] = await db
    .select({
      id: accessTokensTable.id,
      label: accessTokensTable.label,
      status: accessTokensTable.status,
      createdAt: accessTokensTable.createdAt,
      lastUsedAt: accessTokensTable.lastUsedAt,
      revokedAt: accessTokensTable.revokedAt,
      userEmail: usersTable.email,
      userRole: usersTable.role,
    })
    .from(accessTokensTable)
    .innerJoin(usersTable, eq(usersTable.id, accessTokensTable.userId))
    .where(and(eq(accessTokensTable.tokenHash, tokenHash)))
    .limit(1);

  if (!row) {
    console.log("Result:    INVALID (no matching token)");
    process.exit(1);
  }

  const emailMatches = row.userEmail.toLowerCase() === normalizedEmail;
  const isActive = row.status === "active";

  console.log("Token lookup");
  console.log("------------------------------------------------------------");
  console.log(`Token ID:    ${row.id}`);
  console.log(`Label:       ${row.label}`);
  console.log(`User:        ${row.userEmail} (${row.userRole})`);
  console.log(`Status:      ${row.status}`);
  console.log(`Created:     ${row.createdAt.toISOString()}`);
  console.log(`Last used:   ${row.lastUsedAt?.toISOString() ?? "never"}`);
  console.log(`Revoked:     ${row.revokedAt?.toISOString() ?? "never"}`);
  console.log("");
  if (!emailMatches) {
    console.log("Result:      EMAIL MISMATCH (token belongs to a different user)");
    process.exit(1);
  }
  if (!isActive) {
    console.log("Result:      REVOKED");
    process.exit(1);
  }
  console.log("Result:      VALID");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to verify access token:", err);
  process.exit(1);
});
