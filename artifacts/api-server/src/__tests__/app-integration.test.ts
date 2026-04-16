import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const demoUser = {
  id: "user-demo",
  email: "demo@pgtsnd.com",
  name: "Demo User",
  role: "owner",
  avatarUrl: null,
  googleId: null,
};

vi.mock("@workspace/db", () => {
  const usersTable = {
    id: "id",
    email: "email",
    name: "name",
    role: "role",
    avatarUrl: "avatarUrl",
  };
  const limit = vi.fn(async () => [demoUser]);
  const where = vi.fn(() => ({ limit, then: (cb: Function) => cb([demoUser]) }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const db = { select, insert: vi.fn(), update: vi.fn() };
  return { db, usersTable, magicLinkTokensTable: {}, pool: {} };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: {},
  magicLinkTokensTable: {},
}));

vi.mock("../lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../lib/auth")>("../lib/auth");
  return {
    ...actual,
    ensureDemoUser: vi.fn(async () => demoUser),
    createMagicLink: vi.fn(async () => "magic-token-abc"),
    verifyMagicLink: vi.fn(async () => demoUser),
    findOrCreateGoogleUser: vi.fn(async () => demoUser),
  };
});

import appModule from "../app";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../middleware/csrf";

const SESSION_COOKIE = "pgtsnd_session";

function readSetCookies(setCookie: string[] | string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!setCookie) return map;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of arr) {
    const head = c.split(";")[0];
    const idx = head.indexOf("=");
    if (idx > -1) map[head.substring(0, idx)] = head.substring(idx + 1);
  }
  return map;
}

describe("app.ts integration: middleware ordering and auth flow", () => {
  let app: typeof appModule;

  beforeAll(() => {
    app = appModule;
  });

  it("real app issues a CSRF cookie on a GET request", async () => {
    const res = await request(app).get("/api/auth/me");
    const cookies = readSetCookies(res.headers["set-cookie"]);
    expect(cookies[CSRF_COOKIE_NAME]).toBeDefined();
    expect(cookies[CSRF_COOKIE_NAME]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("real app rejects state-changing requests without a CSRF header (403)", async () => {
    const get = await request(app).get("/api/auth/me");
    const csrfCookie = readSetCookies(get.headers["set-cookie"])[CSRF_COOKIE_NAME];
    expect(csrfCookie).toBeDefined();

    await request(app)
      .post("/api/auth/magic-link")
      .set("Cookie", `${CSRF_COOKIE_NAME}=${csrfCookie}`)
      .send({ email: "demo@pgtsnd.com" })
      .expect(403);
  });

  it("real app bypasses CSRF for /api/webhooks/* (route still 404s, but middleware does not block)", async () => {
    // We don't have a registered handler at this path in the test mock,
    // but the CSRF middleware must not produce a 403. Any non-403 status
    // is acceptable here — what matters is that CSRF didn't reject.
    const res = await request(app)
      .post("/api/webhooks/some-unconfigured-webhook")
      .send({ id: "evt_1" });
    expect(res.status).not.toBe(403);
  });

  it("end-to-end: login as demo user, fetch /auth/me, then logout — cookies carry through", async () => {
    const agent = request.agent(app);

    // 1) GET to receive CSRF cookie
    const initial = await agent.get("/api/auth/me").expect(401);
    const csrfToken =
      readSetCookies(initial.headers["set-cookie"])[CSRF_COOKIE_NAME];
    expect(csrfToken).toBeDefined();

    // 2) POST /auth/magic-link with demo email — sets session cookie
    const login = await agent
      .post("/api/auth/magic-link")
      .set(CSRF_HEADER_NAME, csrfToken)
      .send({ email: "demo@pgtsnd.com" })
      .expect(200);
    expect(login.body).toMatchObject({ success: true, demo: true });
    const sessionCookie = readSetCookies(login.headers["set-cookie"])[SESSION_COOKIE];
    expect(sessionCookie).toBeDefined();
    const decoded = jwt.verify(sessionCookie, "test-jwt-secret") as {
      userId: string;
      email: string;
      role: string;
    };
    expect(decoded.userId).toBe(demoUser.id);

    // 3) GET /auth/me — agent automatically resends cookies
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.user).toMatchObject({
      id: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
    });

    // 4) POST /auth/logout — needs CSRF header again
    const logout = await agent
      .post("/api/auth/logout")
      .set(CSRF_HEADER_NAME, csrfToken)
      .expect(200);
    expect(logout.body).toEqual({ success: true });
    const cleared = readSetCookies(logout.headers["set-cookie"]);
    expect(cleared[SESSION_COOKIE]).toBe("");

    // 5) GET /auth/me after logout should be 401
    await agent.get("/api/auth/me").expect(401);
  });
});
