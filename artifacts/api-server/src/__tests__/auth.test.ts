import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgres://unused-in-tests";
process.env.NODE_ENV = "test";

const demoUser = {
  id: "user-demo",
  email: "demo@pgtsnd.com",
  name: "Demo User",
  role: "owner",
  avatarUrl: null,
  googleId: null,
};

const ensureDemoUser = vi.fn(async () => demoUser);
const createMagicLink = vi.fn(async (_email: string) => "magic-token-123");
const verifyMagicLink = vi.fn(async (_token: string) => demoUser);
const findOrCreateGoogleUser = vi.fn(async () => demoUser);

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
  return { db, usersTable };
});

vi.mock("../lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../lib/auth")>("../lib/auth");
  return {
    ...actual,
    ensureDemoUser: (...args: unknown[]) => ensureDemoUser(...(args as [])),
    createMagicLink: (...args: [string]) => createMagicLink(...args),
    verifyMagicLink: (...args: [string]) => verifyMagicLink(...args),
    findOrCreateGoogleUser: (...args: [Parameters<typeof findOrCreateGoogleUser>[0]]) =>
      findOrCreateGoogleUser(...args),
  };
});

import { csrfMiddleware, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../middleware/csrf";
import authRouter from "../routes/auth";

const SESSION_COOKIE = "pgtsnd_session";

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfMiddleware);
  app.use("/api", authRouter);
  return app;
}

interface CookieJar {
  csrfRaw: string;
  csrfToken: string;
  sessionRaw?: string;
  sessionValue?: string;
}

function readCookies(setCookie: string[] | string | undefined): Record<string, string> {
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

function jarToHeader(jar: CookieJar): string {
  const parts = [jar.csrfRaw];
  if (jar.sessionRaw) parts.push(jar.sessionRaw);
  return parts.join("; ");
}

async function getInitialJar(app: Express): Promise<CookieJar> {
  const res = await request(app).get("/api/auth/me");
  const cookies = readCookies(res.headers["set-cookie"]);
  const csrf = cookies[CSRF_COOKIE_NAME];
  if (!csrf) throw new Error("expected CSRF cookie to be issued");
  return {
    csrfRaw: `${CSRF_COOKIE_NAME}=${csrf}`,
    csrfToken: csrf,
  };
}

describe("auth routes (end-to-end with cookies and CSRF)", () => {
  let app: Express;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    ensureDemoUser.mockClear();
    createMagicLink.mockClear();
    verifyMagicLink.mockClear();
    findOrCreateGoogleUser.mockClear();
  });

  it("GET /auth/me returns 401 with no session cookie but still issues CSRF cookie", async () => {
    const res = await request(app).get("/api/auth/me").expect(401);
    expect(res.body).toEqual({ error: "Not authenticated" });

    const cookies = readCookies(res.headers["set-cookie"]);
    expect(cookies[CSRF_COOKIE_NAME]).toBeDefined();
  });

  it("POST /auth/magic-link is rejected without a CSRF header", async () => {
    const jar = await getInitialJar(app);

    await request(app)
      .post("/api/auth/magic-link")
      .set("Cookie", jarToHeader(jar))
      .send({ email: "demo@pgtsnd.com" })
      .expect(403);
  });

  it("POST /auth/magic-link with demo email logs in and sets a session cookie", async () => {
    const jar = await getInitialJar(app);

    const res = await request(app)
      .post("/api/auth/magic-link")
      .set("Cookie", jarToHeader(jar))
      .set(CSRF_HEADER_NAME, jar.csrfToken)
      .send({ email: "demo@pgtsnd.com" })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      demo: true,
      redirect: "/team/dashboard",
    });
    expect(ensureDemoUser).toHaveBeenCalledTimes(1);

    const cookies = readCookies(res.headers["set-cookie"]);
    expect(cookies[SESSION_COOKIE]).toBeDefined();

    const decoded = jwt.verify(cookies[SESSION_COOKIE], "test-jwt-secret") as {
      userId: string;
      email: string;
      role: string;
    };
    expect(decoded.userId).toBe(demoUser.id);
    expect(decoded.email).toBe(demoUser.email);
    expect(decoded.role).toBe(demoUser.role);
  });

  it("POST /auth/magic-link rejects missing email", async () => {
    const jar = await getInitialJar(app);

    const res = await request(app)
      .post("/api/auth/magic-link")
      .set("Cookie", jarToHeader(jar))
      .set(CSRF_HEADER_NAME, jar.csrfToken)
      .send({})
      .expect(400);
    expect(res.body).toEqual({ error: "Email is required" });
  });

  it("GET /auth/verify-magic-link with a valid token issues a session cookie", async () => {
    const jar = await getInitialJar(app);

    const res = await request(app)
      .get("/api/auth/verify-magic-link?token=magic-token-123")
      .set("Cookie", jarToHeader(jar))
      .expect(200);

    expect(verifyMagicLink).toHaveBeenCalledWith("magic-token-123");
    expect(res.body).toMatchObject({
      success: true,
      user: { id: demoUser.id, email: demoUser.email, role: demoUser.role },
      redirect: "/team/dashboard",
    });

    const cookies = readCookies(res.headers["set-cookie"]);
    expect(cookies[SESSION_COOKIE]).toBeDefined();
  });

  it("GET /auth/verify-magic-link with invalid token returns 401", async () => {
    verifyMagicLink.mockResolvedValueOnce(null as unknown as typeof demoUser);
    const jar = await getInitialJar(app);

    const res = await request(app)
      .get("/api/auth/verify-magic-link?token=bad")
      .set("Cookie", jarToHeader(jar))
      .expect(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
  });

  it("GET /auth/me with a valid session cookie returns the user", async () => {
    const jar = await getInitialJar(app);
    const session = jwt.sign(
      { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
      "test-jwt-secret",
      { expiresIn: "7d" },
    );
    jar.sessionRaw = `${SESSION_COOKIE}=${session}`;
    jar.sessionValue = session;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", jarToHeader(jar))
      .expect(200);

    expect(res.body.user).toMatchObject({
      id: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
    });
  });

  it("GET /auth/me with a tampered session cookie returns 401 and clears the cookie", async () => {
    const jar = await getInitialJar(app);
    jar.sessionRaw = `${SESSION_COOKIE}=not-a-real-jwt`;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", jarToHeader(jar))
      .expect(401);
    expect(res.body).toEqual({ error: "Invalid session" });

    const cookies = readCookies(res.headers["set-cookie"]);
    expect(cookies[SESSION_COOKIE]).toBe("");
  });

  it("POST /auth/logout requires a CSRF header and clears the session cookie", async () => {
    const jar = await getInitialJar(app);
    const session = jwt.sign(
      { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
      "test-jwt-secret",
      { expiresIn: "7d" },
    );
    jar.sessionRaw = `${SESSION_COOKIE}=${session}`;

    await request(app)
      .post("/api/auth/logout")
      .set("Cookie", jarToHeader(jar))
      .expect(403);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", jarToHeader(jar))
      .set(CSRF_HEADER_NAME, jar.csrfToken)
      .expect(200);

    expect(res.body).toEqual({ success: true });
    const cookies = readCookies(res.headers["set-cookie"]);
    expect(cookies[SESSION_COOKIE]).toBe("");
  });
});
