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
  return {
    db,
    usersTable,
    magicLinkTokensTable: {},
    projectsTable: {},
    projectMembersTable: {},
    deliverablesTable: {},
    deliverableVersionsTable: {},
    reviewsTable: {},
    messagesTable: {},
    insertProjectSchema: {},
    updateProjectSchema: {},
    insertProjectMemberSchema: {},
    selectProjectSchema: {},
    selectProjectMemberSchema: {},
    insertDeliverableSchema: {},
    updateDeliverableSchema: {},
    selectDeliverableSchema: {},
    selectDeliverableVersionSchema: {},
    insertReviewSchema: {},
    updateReviewSchema: {},
    selectReviewSchema: {},
    insertMessageSchema: {},
    selectMessageSchema: {},
    pool: {},
  };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: {},
  magicLinkTokensTable: {},
}));

vi.mock("../services/notifications", () => ({
  notifyClientWelcomeIfFirstProject: vi.fn(async () => undefined),
  notifyDeliverableSubmittedForReview: vi.fn(async () => undefined),
}));

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

async function obtainCsrfToken(app: typeof appModule): Promise<string> {
  const res = await request(app).get("/api/auth/me");
  const token = readSetCookies(res.headers["set-cookie"])[CSRF_COOKIE_NAME];
  if (!token) throw new Error("expected CSRF cookie to be issued");
  return token;
}

function signSession(): string {
  return jwt.sign(
    { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
    "test-jwt-secret",
    { expiresIn: "7d" },
  );
}

interface ProtectedCase {
  name: string;
  method: "post" | "patch" | "delete";
  path: string;
  body?: unknown;
}

const protectedCases: ProtectedCase[] = [
  // projects
  { name: "create project", method: "post", path: "/api/projects", body: { name: "x" } },
  { name: "update project", method: "patch", path: "/api/projects/p1", body: { name: "y" } },
  { name: "delete project", method: "delete", path: "/api/projects/p1" },
  { name: "add project member", method: "post", path: "/api/projects/p1/members", body: { userId: "u1" } },
  { name: "remove project member", method: "delete", path: "/api/projects/p1/members/u1" },

  // deliverables
  { name: "create deliverable", method: "post", path: "/api/projects/p1/deliverables", body: { title: "x" } },
  { name: "update deliverable", method: "patch", path: "/api/deliverables/d1", body: { title: "y" } },
  { name: "submit deliverable for review", method: "post", path: "/api/deliverables/d1/submit-for-review", body: {} },
  { name: "delete deliverable", method: "delete", path: "/api/deliverables/d1" },

  // reviews
  { name: "create review", method: "post", path: "/api/deliverables/d1/reviews", body: { status: "approved" } },
  { name: "update review", method: "patch", path: "/api/reviews/r1", body: { status: "approved" } },
  { name: "delete review", method: "delete", path: "/api/reviews/r1" },

  // messages
  { name: "create message", method: "post", path: "/api/projects/p1/messages", body: { content: "hi" } },
  { name: "mark message read", method: "patch", path: "/api/messages/m1/read", body: {} },
  { name: "delete message", method: "delete", path: "/api/messages/m1" },
];

describe("protected API endpoints: auth + CSRF gating", () => {
  let app: typeof appModule;

  beforeAll(() => {
    app = appModule;
  });

  describe("CSRF rejection (403) — authenticated session, missing CSRF header", () => {
    for (const c of protectedCases) {
      it(`${c.method.toUpperCase()} ${c.path} (${c.name}) is rejected without CSRF header`, async () => {
        const csrf = await obtainCsrfToken(app);
        const session = signSession();
        const cookieHeader = `${CSRF_COOKIE_NAME}=${csrf}; ${SESSION_COOKIE}=${session}`;

        const req = request(app)[c.method](c.path).set("Cookie", cookieHeader);
        const res = c.body !== undefined ? await req.send(c.body) : await req;

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Invalid or missing CSRF token" });
      });
    }
  });

  describe("Unauthenticated rejection (401) — valid CSRF, no session cookie", () => {
    for (const c of protectedCases) {
      it(`${c.method.toUpperCase()} ${c.path} (${c.name}) is rejected with 401 when not logged in`, async () => {
        const csrf = await obtainCsrfToken(app);
        const cookieHeader = `${CSRF_COOKIE_NAME}=${csrf}`;

        const req = request(app)
          [c.method](c.path)
          .set("Cookie", cookieHeader)
          .set(CSRF_HEADER_NAME, csrf);
        const res = c.body !== undefined ? await req.send(c.body) : await req;

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Authentication required" });
      });
    }

    it("GET /api/projects (read endpoint behind authMiddleware) returns 401 when not logged in", async () => {
      // GET requests don't need CSRF, but still require auth.
      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Authentication required" });
    });

    it("GET /api/projects/p1/deliverables returns 401 when not logged in", async () => {
      const res = await request(app).get("/api/projects/p1/deliverables");
      expect(res.status).toBe(401);
    });

    it("GET /api/deliverables/d1/reviews returns 401 when not logged in", async () => {
      const res = await request(app).get("/api/deliverables/d1/reviews");
      expect(res.status).toBe(401);
    });

    it("GET /api/projects/p1/messages returns 401 when not logged in", async () => {
      const res = await request(app).get("/api/projects/p1/messages");
      expect(res.status).toBe(401);
    });
  });

  describe("Tampered session cookie is treated as unauthenticated (401)", () => {
    it("POST /api/projects with garbage session cookie + valid CSRF returns 401", async () => {
      const csrf = await obtainCsrfToken(app);
      const cookieHeader = `${CSRF_COOKIE_NAME}=${csrf}; ${SESSION_COOKIE}=not-a-real-jwt`;

      const res = await request(app)
        .post("/api/projects")
        .set("Cookie", cookieHeader)
        .set(CSRF_HEADER_NAME, csrf)
        .send({ name: "x" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Authentication required" });
    });
  });
});
