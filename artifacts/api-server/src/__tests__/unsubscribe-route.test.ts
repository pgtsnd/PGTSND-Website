import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";

interface FakeUserRow {
  id: string;
  email: string;
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
}

const userRows: FakeUserRow[] = [];

function resetUsers() {
  userRows.length = 0;
}

vi.mock("@workspace/db", () => {
  const usersTable = {
    __name: "users",
    id: "id",
    email: "email",
    emailNotifyDormantTokens: "emailNotifyDormantTokens",
    dormantTokensSnoozeUntil: "dormantTokensSnoozeUntil",
  };

  function makeUpdate() {
    return (_table: { __name: string }) => ({
      set: (vals: Partial<FakeUserRow>) => ({
        where: (cond: { __targetId: string }) => {
          const apply = () => {
            const idx = userRows.findIndex((u) => u.id === cond.__targetId);
            if (idx === -1) return [];
            userRows[idx] = { ...userRows[idx], ...vals };
            return [userRows[idx]];
          };
          const chain = {
            returning: async (_cols?: Record<string, unknown>) => {
              const rows = apply();
              return rows.map((r) => ({ email: r.email }));
            },
            then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
              try {
                apply();
                return Promise.resolve(undefined).then(resolve, reject);
              } catch (e) {
                return Promise.reject(e).then(resolve, reject);
              }
            },
          };
          return chain;
        },
      }),
    });
  }

  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: makeUpdate(),
    },
    usersTable,
    magicLinkTokensTable: {},
    pool: {},
  };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: {},
  magicLinkTokensTable: {},
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm",
  );
  return {
    ...actual,
    eq: (_col: unknown, val: unknown) => ({ __targetId: val }),
  };
});

import appModule from "../app";
import { createUnsubscribeToken } from "../lib/unsubscribe-token";
import { CSRF_COOKIE_NAME } from "../middleware/csrf";

function findUser(id: string): FakeUserRow | undefined {
  return userRows.find((u) => u.id === id);
}

describe("one-click unsubscribe route (integration)", () => {
  beforeEach(() => {
    resetUsers();
    userRows.push({
      id: "user-abc",
      email: "owner@example.com",
      emailNotifyDormantTokens: true,
      dormantTokensSnoozeUntil: new Date("2030-01-01T00:00:00Z"),
      dormantTokensUnsubscribedAt: null,
    });
  });

  it("GET /api/unsubscribe/dormant-tokens with a valid token flips the flag and renders the confirmation page", async () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-abc");

    const res = await request(appModule)
      .get(`/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`)
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("You're unsubscribed");
    expect(res.text).toContain("owner@example.com");
    expect(res.text).toContain("dormant access-token summary");

    const updated = findUser("user-abc")!;
    expect(updated.emailNotifyDormantTokens).toBe(false);
    expect(updated.dormantTokensSnoozeUntil).toBeNull();
    expect(updated.dormantTokensUnsubscribedAt).toBeInstanceOf(Date);
    expect(updated.dormantTokensUnsubscribedAt!.getTime()).toBeGreaterThan(
      Date.now() - 5_000,
    );
  });

  it("GET with an invalid/tampered token returns 400 and does not flip the flag", async () => {
    const res = await request(appModule)
      .get("/api/unsubscribe/dormant-tokens?token=not-a-real-token")
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Invalid or expired link");

    const user = findUser("user-abc")!;
    expect(user.emailNotifyDormantTokens).toBe(true);
  });

  it("GET with no token at all returns 400", async () => {
    await request(appModule).get("/api/unsubscribe/dormant-tokens").expect(400);
    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(true);
  });

  it("POST /api/unsubscribe/dormant-tokens (RFC 8058 one-click) flips the flag without a CSRF header", async () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-abc");

    // Crucially: no CSRF cookie, no CSRF header — just a raw POST as a
    // mail provider's one-click unsubscribe endpoint would issue.
    const res = await request(appModule)
      .post(
        `/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`,
      )
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("List-Unsubscribe=One-Click")
      .expect(200);

    expect(res.body).toEqual({ ok: true });

    const updated = findUser("user-abc")!;
    expect(updated.emailNotifyDormantTokens).toBe(false);
    expect(updated.dormantTokensSnoozeUntil).toBeNull();
    expect(updated.dormantTokensUnsubscribedAt).toBeInstanceOf(Date);
    expect(updated.dormantTokensUnsubscribedAt!.getTime()).toBeGreaterThan(
      Date.now() - 5_000,
    );
  });

  it("POST with an invalid token returns 400 JSON and does not flip the flag", async () => {
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens?token=garbage")
      .expect(400);

    expect(res.body).toEqual({ error: "Invalid or expired token" });
    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(true);
  });

  it("POST with a properly-signed token for a different kind is rejected (cross-kind isolation)", async () => {
    // Forge a token that is fully, validly signed by the same secret but
    // for a different unsubscribe category. A future opt-out kind must
    // not be accepted by the dormant-tokens route just because the
    // signature is otherwise valid.
    const payload = "other-kind:user-abc";
    const b64url = (buf: Buffer) =>
      buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const body = b64url(Buffer.from(payload, "utf8"));
    const sig = b64url(
      crypto
        .createHmac("sha256", process.env.JWT_SECRET as string)
        .update(payload)
        .digest(),
    );
    const wrongKindToken = `${body}.${sig}`;

    await request(appModule)
      .post(
        `/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(wrongKindToken)}`,
      )
      .expect(400);

    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(true);
  });

  it("the unsubscribe endpoint is exempt from CSRF even when a CSRF cookie is present", async () => {
    const token = createUnsubscribeToken("dormant-tokens", "user-abc");

    // Send a fake CSRF cookie but no matching header — a normal
    // protected POST would be 403'd here.
    const res = await request(appModule)
      .post(
        `/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`,
      )
      .set("Cookie", `${CSRF_COOKIE_NAME}=dead-beef-not-the-real-token`)
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(false);
  });
});
