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
  method: "post" | "patch" | "delete" | "put";
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

  // users
  { name: "update my notification prefs", method: "patch", path: "/api/users/me/notifications", body: { emailNotifyReviews: true } },
  { name: "update my dormant-tokens email prefs", method: "patch", path: "/api/users/me/dormant-tokens-email", body: { emailNotifyDormantTokens: true } },
  { name: "update my bookkeeper email", method: "patch", path: "/api/users/me/bookkeeper-email", body: { bookkeeperEmail: "b@x.com" } },
  { name: "create user", method: "post", path: "/api/users", body: { email: "x@y.com", name: "x", role: "client" } },
  { name: "update user", method: "patch", path: "/api/users/u1", body: { name: "y" } },
  { name: "delete user", method: "delete", path: "/api/users/u1" },

  // organizations
  { name: "create organization", method: "post", path: "/api/organizations", body: { name: "Org" } },
  { name: "update organization", method: "patch", path: "/api/organizations/o1", body: { name: "Org2" } },
  { name: "delete organization", method: "delete", path: "/api/organizations/o1" },

  // phases
  { name: "create phase", method: "post", path: "/api/projects/p1/phases", body: { name: "Phase 1" } },
  { name: "update phase", method: "patch", path: "/api/phases/ph1", body: { name: "x" } },
  { name: "delete phase", method: "delete", path: "/api/phases/ph1" },

  // tasks
  { name: "create task", method: "post", path: "/api/projects/p1/tasks", body: { title: "T" } },
  { name: "update task", method: "patch", path: "/api/tasks/t1", body: { title: "U" } },
  { name: "delete task", method: "delete", path: "/api/tasks/t1" },
  { name: "create task item", method: "post", path: "/api/tasks/t1/items", body: { content: "x" } },
  { name: "update task item", method: "patch", path: "/api/task-items/ti1", body: { content: "y" } },
  { name: "delete task item", method: "delete", path: "/api/task-items/ti1" },

  // dm
  { name: "send DM", method: "post", path: "/api/dm/threads/u2", body: { content: "hi" } },
  { name: "mark DM thread read", method: "patch", path: "/api/dm/threads/u2/read", body: {} },

  // contracts
  { name: "create contract", method: "post", path: "/api/projects/p1/contracts", body: { title: "C" } },
  { name: "update contract", method: "patch", path: "/api/contracts/c1", body: { title: "C2" } },
  { name: "delete contract", method: "delete", path: "/api/contracts/c1" },

  // client
  { name: "client send message", method: "post", path: "/api/client/messages", body: { projectId: "p1", content: "hi" } },
  { name: "client approve deliverable", method: "post", path: "/api/client/deliverables/d1/approve", body: {} },
  { name: "client request revision", method: "post", path: "/api/client/deliverables/d1/request-revision", body: { comment: "fix" } },
  { name: "client update profile", method: "patch", path: "/api/client/profile", body: { name: "C" } },

  // integrations (note: /api/webhooks/* are intentionally CSRF-exempt and unauthenticated)
  { name: "rotate vault key", method: "post", path: "/api/integrations/vault/rotate", body: { oldKey: "a", newKey: "b" } },
  { name: "encrypt existing integrations", method: "post", path: "/api/integrations/vault/encrypt-existing", body: {} },
  { name: "upsert integration settings", method: "put", path: "/api/integrations/stripe", body: { enabled: true, config: {} } },
  { name: "delete integration settings", method: "delete", path: "/api/integrations/stripe" },
  { name: "upsert scheduled invoice export", method: "put", path: "/api/scheduled-invoice-exports", body: { enabled: true, filters: {} } },
  { name: "delete scheduled invoice export", method: "delete", path: "/api/scheduled-invoice-exports" },
  { name: "run scheduled invoice export now", method: "post", path: "/api/scheduled-invoice-exports/run-now", body: {} },
  { name: "create invoice", method: "post", path: "/api/projects/p1/invoices", body: { amount: 100 } },
  { name: "update invoice", method: "patch", path: "/api/invoices/i1", body: { status: "paid" } },
  { name: "delete invoice", method: "delete", path: "/api/invoices/i1" },
  { name: "send invoice via stripe", method: "post", path: "/api/invoices/i1/send", body: {} },
  { name: "create invoice checkout", method: "post", path: "/api/invoices/i1/checkout", body: { successUrl: "https://x", cancelUrl: "https://x" } },
  { name: "email invoice export", method: "post", path: "/api/integrations/invoices/email-export", body: { recipient: "a@b.com", csv: "x" } },
  { name: "email invoice payment link", method: "post", path: "/api/invoices/i1/email-payment-link", body: {} },
  { name: "send slack message", method: "post", path: "/api/integrations/slack/messages", body: { channelId: "C", text: "hi" } },
  { name: "send docusign envelope", method: "post", path: "/api/integrations/docusign/send", body: { contractId: "c1", signerEmail: "a@b.com", signerName: "A" } },

  // video-review
  { name: "create video comment", method: "post", path: "/api/deliverables/d1/comments", body: { timestampSeconds: 1, content: "hi" } },
  { name: "resolve video comment", method: "patch", path: "/api/comments/vc1/resolve", body: { resolved: true } },
  { name: "reopen video comment", method: "post", path: "/api/comments/vc1/reopen", body: {} },
  { name: "reply to video comment", method: "post", path: "/api/comments/vc1/replies", body: { content: "hi" } },
  { name: "create review link", method: "post", path: "/api/deliverables/d1/review-links", body: {} },

  // project-mutes
  { name: "mute project", method: "put", path: "/api/users/me/project-mutes/p1", body: {} },
  { name: "unmute project", method: "delete", path: "/api/users/me/project-mutes/p1" },
  { name: "bulk mute projects", method: "put", path: "/api/users/me/project-mutes", body: { projectIds: ["p1"] } },
  { name: "bulk unmute projects", method: "delete", path: "/api/users/me/project-mutes", body: { projectIds: ["p1"] } },
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

    it("GET /api/admin/email-previews returns 401 when not logged in", async () => {
      // admin-email-previews has no mutating endpoints, but its read paths
      // still sit behind authMiddleware and should reject anonymous callers.
      const res = await request(app).get("/api/admin/email-previews");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Authentication required" });
    });

    it("GET /api/admin/email-previews/review-ready returns 401 when not logged in", async () => {
      const res = await request(app).get("/api/admin/email-previews/review-ready");
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
