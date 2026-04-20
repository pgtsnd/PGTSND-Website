import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import crypto from "crypto";

interface FakeUserRow {
  id: string;
  email: string;
  name: string | null;
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
}

const userRows: FakeUserRow[] = [];

function resetUsers() {
  userRows.length = 0;
}

const sendEmailMock = vi.fn(async () => ({ ok: true as const }));

vi.mock("../services/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...(args as [])),
  getAppBaseUrl: () => "https://app.example.com",
}));

vi.mock("@workspace/db", () => {
  const usersTable = {
    __name: "users",
    id: "id",
    email: "email",
    name: "name",
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

  function makeSelect() {
    return (_cols?: Record<string, unknown>) => ({
      from: (_table: { __name: string }) => ({
        where: (cond: { __emailMatch?: string; __targetId?: string }) => {
          const matchRows = (): FakeUserRow[] => {
            if (cond.__emailMatch !== undefined) {
              const target = cond.__emailMatch;
              return userRows.filter(
                (u) => u.email.toLowerCase() === target,
              );
            }
            if (cond.__targetId !== undefined) {
              return userRows.filter((u) => u.id === cond.__targetId);
            }
            return [];
          };
          const project = (rows: FakeUserRow[]) =>
            rows.map((r) => ({ id: r.id, email: r.email, name: r.name }));
          const limited = {
            limit: async (_n: number) => project(matchRows()).slice(0, _n),
            then: (
              resolve: (v: unknown) => unknown,
              reject?: (e: unknown) => unknown,
            ) =>
              Promise.resolve(project(matchRows())).then(resolve, reject),
          };
          return limited;
        },
      }),
    });
  }

  return {
    db: {
      select: makeSelect(),
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
    sql: (_strings: TemplateStringsArray, ..._values: unknown[]) => {
      // Our resend handler builds: sql`lower(${usersTable.email}) = ${email}`.
      // The lowercased email is the last interpolated value.
      return { __emailMatch: _values[_values.length - 1] };
    },
  };
});

import appModule from "../app";
import { createUnsubscribeToken } from "../lib/unsubscribe-token";
import { CSRF_COOKIE_NAME } from "../middleware/csrf";
import {
  resetRateLimitNamespace,
  UNSUBSCRIBE_RESEND_LIMITS,
} from "../middleware/rate-limit";

function findUser(id: string): FakeUserRow | undefined {
  return userRows.find((u) => u.id === id);
}

describe("one-click unsubscribe route (integration)", () => {
  beforeEach(() => {
    resetUsers();
    resetRateLimitNamespace("unsubscribe-resend:ip");
    resetRateLimitNamespace("unsubscribe-resend:email");
    sendEmailMock.mockClear();
    sendEmailMock.mockImplementation(async () => ({ ok: true as const }));
    userRows.push({
      id: "user-abc",
      email: "owner@example.com",
      name: "Olivia Owner",
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
    // The page should explain that links expire after a set window
    // and point users to the Notifications settings page.
    expect(res.text).toContain("90 days");
    expect(res.text).toContain("/team/settings?section=notifications");

    const user = findUser("user-abc")!;
    expect(user.emailNotifyDormantTokens).toBe(true);
  });

  it("GET with a valid token shows the date the unsubscribe link was issued", async () => {
    const issuedAt = new Date("2026-02-10T08:00:00Z");
    const token = createUnsubscribeToken("dormant-tokens", "user-abc", issuedAt);

    const res = await request(appModule)
      .get(`/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`)
      .expect(200);

    expect(res.text).toContain("You're unsubscribed");
    expect(res.text).toContain("issued on");
    expect(res.text).toContain("February 10, 2026");
  });

  it("GET with no token at all returns 400", async () => {
    await request(appModule).get("/api/unsubscribe/dormant-tokens").expect(400);
    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(true);
  });

  it("GET with an expired token (older than the TTL) returns 400 with the invalid-or-expired page and does not flip the flag", async () => {
    const expiredIssuedAt = Date.now() - 200 * 24 * 60 * 60 * 1000; // 200 days ago
    const token = createUnsubscribeToken("dormant-tokens", "user-abc", {
      issuedAt: expiredIssuedAt,
    });

    const res = await request(appModule)
      .get(`/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`)
      .expect(400);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Invalid or expired link");

    const user = findUser("user-abc")!;
    expect(user.emailNotifyDormantTokens).toBe(true);
  });

  it("POST with an expired token returns 400 JSON and does not flip the flag", async () => {
    const expiredIssuedAt = Date.now() - 200 * 24 * 60 * 60 * 1000;
    const token = createUnsubscribeToken("dormant-tokens", "user-abc", {
      issuedAt: expiredIssuedAt,
    });

    const res = await request(appModule)
      .post(
        `/api/unsubscribe/dormant-tokens?token=${encodeURIComponent(token)}`,
      )
      .expect(400);

    expect(res.body).toEqual({ error: "Invalid or expired token" });
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

  it("the expired-link page offers a form to request a fresh unsubscribe link", async () => {
    const res = await request(appModule)
      .get("/api/unsubscribe/dormant-tokens?token=not-a-real-token")
      .expect(400);

    expect(res.text).toContain("Invalid or expired link");
    expect(res.text).toMatch(/<form[^>]+method="POST"/i);
    expect(res.text).toContain('action="/api/unsubscribe/dormant-tokens/resend"');
    expect(res.text).toContain('name="email"');
    expect(res.text).toContain("Send me a new unsubscribe link");
  });

  it("POST resend with a known email sends a fresh unsubscribe link to the address on file", async () => {
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=Owner%40Example.com")
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Check your inbox");

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(args.to).toBe("owner@example.com");
    expect(args.subject).toMatch(/unsubscribe link/i);
    const linkMatch = args.text.match(
      /https:\/\/app\.example\.com\/api\/unsubscribe\/dormant-tokens\?token=([^\s]+)/,
    );
    expect(linkMatch).not.toBeNull();
    // The freshly-issued link must verify and apply the opt-out end-to-end.
    const followUp = await request(appModule)
      .get(
        `/api/unsubscribe/dormant-tokens?token=${linkMatch![1]}`,
      )
      .expect(200);
    expect(followUp.text).toContain("You're unsubscribed");
    expect(findUser("user-abc")!.emailNotifyDormantTokens).toBe(false);
  });

  it("the resend email shows the date the fresh link will actually stop working", async () => {
    const before = Date.now();
    await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=owner%40example.com")
      .expect(200);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0] as {
      text: string;
      html: string;
    };

    // Compute the window of acceptable expiry dates, accounting for the
    // few-ms gap between `before` and when the route actually issued the
    // token. The displayed date must fall in that window.
    const ttlMs = 90 * 24 * 60 * 60 * 1000;
    const fmt = (ms: number) =>
      new Date(ms).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
    const candidates = new Set<string>();
    for (let t = before; t <= Date.now(); t += 1) {
      candidates.add(fmt(t + ttlMs));
      if (candidates.size > 3) break;
    }
    candidates.add(fmt(before + ttlMs));
    candidates.add(fmt(Date.now() + ttlMs));

    const matches = (haystack: string) =>
      [...candidates].some((c) => haystack.includes(`valid until ${c}`));
    expect(matches(args.text)).toBe(true);
    expect(
      [...candidates].some((c) => args.html.includes(`Valid until ${c}`)),
    ).toBe(true);

    // And the displayed date must match the verifier — extract the link
    // from the email and confirm it still verifies right now (i.e. the
    // promise of "valid until <future-date>" is real).
    const linkMatch = args.text.match(
      /https:\/\/app\.example\.com\/api\/unsubscribe\/dormant-tokens\?token=([^\s]+)/,
    );
    expect(linkMatch).not.toBeNull();
    const followUp = await request(appModule)
      .get(`/api/unsubscribe/dormant-tokens?token=${linkMatch![1]}`)
      .expect(200);
    expect(followUp.text).toContain("You're unsubscribed");
  });

  it("POST resend with an unknown email returns the same generic page and sends nothing", async () => {
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=stranger%40nowhere.test")
      .expect(200);

    expect(res.text).toContain("Check your inbox");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("POST resend with no/blank/malformed email returns the generic page without sending", async () => {
    for (const body of ["", "email=", "email=not-an-email"]) {
      sendEmailMock.mockClear();
      const res = await request(appModule)
        .post("/api/unsubscribe/dormant-tokens/resend")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send(body)
        .expect(200);
      expect(res.text).toContain("Check your inbox");
      expect(sendEmailMock).not.toHaveBeenCalled();
    }
  });

  it("POST resend silently throttles repeated requests for the same email", async () => {
    const limit = UNSUBSCRIBE_RESEND_LIMITS.perEmail.limit;
    expect(limit).toBeGreaterThanOrEqual(2); // a real recipient retrying once must succeed

    for (let i = 0; i < limit; i++) {
      await request(appModule)
        .post("/api/unsubscribe/dormant-tokens/resend")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send("email=owner%40example.com")
        .expect(200);
    }
    expect(sendEmailMock).toHaveBeenCalledTimes(limit);

    sendEmailMock.mockClear();
    // The next attempt within the window should still render the same page
    // but must not actually send another email.
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=owner%40example.com")
      .expect(200);
    expect(res.text).toContain("Check your inbox");
    expect(sendEmailMock).not.toHaveBeenCalled();

    // Email casing should not be a way to bypass the per-email cap.
    const res2 = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=OWNER%40Example.COM")
      .expect(200);
    expect(res2.text).toContain("Check your inbox");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("POST resend silently throttles a flood from a single IP across many addresses", async () => {
    // Stage extra real users so per-email limits don't fire first.
    const ipLimit = UNSUBSCRIBE_RESEND_LIMITS.perIp.limit;
    for (let i = 0; i < ipLimit + 5; i++) {
      userRows.push({
        id: `user-${i}`,
        email: `target${i}@example.com`,
        name: null,
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: null,
      });
    }

    for (let i = 0; i < ipLimit; i++) {
      await request(appModule)
        .post("/api/unsubscribe/dormant-tokens/resend")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send(`email=target${i}%40example.com`)
        .expect(200);
    }
    expect(sendEmailMock).toHaveBeenCalledTimes(ipLimit);

    sendEmailMock.mockClear();
    // A fresh email address from the same IP, past the cap, must be silently
    // dropped — same generic page, no real email sent.
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send(`email=target${ipLimit}%40example.com`)
      .expect(200);
    expect(res.text).toContain("Check your inbox");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("POST resend with an unknown email still consumes the per-IP throttle (no probing free pass)", async () => {
    const ipLimit = UNSUBSCRIBE_RESEND_LIMITS.perIp.limit;
    for (let i = 0; i < ipLimit; i++) {
      await request(appModule)
        .post("/api/unsubscribe/dormant-tokens/resend")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send(`email=stranger${i}%40nowhere.test`)
        .expect(200);
    }
    expect(sendEmailMock).not.toHaveBeenCalled();

    // After consuming the IP cap on unknowns, a real address from the same
    // IP is still throttled — generic page, no email.
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=owner%40example.com")
      .expect(200);
    expect(res.text).toContain("Check your inbox");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("POST resend is exempt from CSRF (no header / cookie required)", async () => {
    const res = await request(appModule)
      .post("/api/unsubscribe/dormant-tokens/resend")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Cookie", `${CSRF_COOKIE_NAME}=dead-beef-not-the-real-token`)
      .send("email=owner%40example.com")
      .expect(200);

    expect(res.text).toContain("Check your inbox");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });
});
