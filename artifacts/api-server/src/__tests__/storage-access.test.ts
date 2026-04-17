import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";

type Role = "owner" | "partner" | "crew" | "client";

interface MockUser {
  id: string;
  role: Role;
}

interface MockDeliverable {
  id: string;
  projectId: string;
  fileUrl: string;
}

interface MockReviewLink {
  token: string;
  deliverableId: string;
  expiresAt: Date | null;
}

interface MockProjectMember {
  projectId: string;
  userId: string;
}

const state = {
  users: new Map<string, MockUser>(),
  deliverables: new Map<string, MockDeliverable>(),
  reviewLinks: [] as MockReviewLink[],
  projectMembers: [] as MockProjectMember[],
  projects: new Map<string, { clientId: string | null }>(),
  mediaUploads: new Map<string, { id: string; objectPath: string }>(),
  deliverableVersions: [] as { id: string; deliverableId: string; fileUrl: string }[],
};

const usersTable = {
  id: "users.id",
  email: "users.email",
  name: "users.name",
  role: "users.role",
  avatarUrl: "users.avatarUrl",
};
const deliverablesTable = {
  id: "deliverables.id",
  projectId: "deliverables.projectId",
  fileUrl: "deliverables.fileUrl",
};
const reviewLinksTable = {
  id: "reviewLinks.id",
  token: "reviewLinks.token",
  deliverableId: "reviewLinks.deliverableId",
  expiresAt: "reviewLinks.expiresAt",
};
const mediaUploadsTable = {
  id: "mediaUploads.id",
  objectPath: "mediaUploads.objectPath",
  createdAt: "mediaUploads.createdAt",
};
const projectsTable = {
  id: "projects.id",
  clientId: "projects.clientId",
};
const projectMembersTable = {
  projectId: "projectMembers.projectId",
  userId: "projectMembers.userId",
};
const deliverableVersionsTable = {
  id: "deliverableVersions.id",
  deliverableId: "deliverableVersions.deliverableId",
  fileUrl: "deliverableVersions.fileUrl",
};

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: unknown) => ({ _op: "eq", col, val }),
  and: (...args: unknown[]) => ({ _op: "and", args }),
  or: (...args: unknown[]) => ({ _op: "or", args }),
  like: (col: string, val: unknown) => ({ _op: "like", col, val }),
  desc: (col: string) => ({ _op: "desc", col }),
  asc: (col: string) => ({ _op: "asc", col }),
}));

function extractEqs(
  cond: unknown,
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  if (!cond || typeof cond !== "object") return out;
  const c = cond as { _op?: string; col?: string; val?: unknown; args?: unknown[] };
  if (c._op === "eq" && c.col) out[c.col] = c.val;
  else if (c._op === "and" && c.args) c.args.forEach((a) => extractEqs(a, out));
  return out;
}

function runQuery(table: unknown, cond: unknown): unknown[] {
  const eqs = extractEqs(cond);
  if (table === usersTable) {
    const id = eqs["users.id"] as string | undefined;
    if (!id) return [];
    const u = state.users.get(id);
    return u ? [u] : [];
  }
  if (table === mediaUploadsTable) {
    const op = eqs["mediaUploads.objectPath"] as string | undefined;
    if (!op) return [];
    const m = state.mediaUploads.get(op);
    return m ? [m] : [];
  }
  if (table === deliverablesTable) {
    const fileUrl = eqs["deliverables.fileUrl"] as string | undefined;
    if (!fileUrl) return [];
    const d = state.deliverables.get(fileUrl);
    return d ? [d] : [];
  }
  if (table === reviewLinksTable) {
    const token = eqs["reviewLinks.token"] as string | undefined;
    const deliverableId = eqs["reviewLinks.deliverableId"] as string | undefined;
    return state.reviewLinks.filter(
      (l) => l.token === token && l.deliverableId === deliverableId,
    );
  }
  if (table === projectMembersTable) {
    const projectId = eqs["projectMembers.projectId"] as string | undefined;
    const userId = eqs["projectMembers.userId"] as string | undefined;
    return state.projectMembers.filter(
      (m) => m.projectId === projectId && m.userId === userId,
    );
  }
  if (table === projectsTable) {
    const id = eqs["projects.id"] as string | undefined;
    if (!id) return [];
    const p = state.projects.get(id);
    return p ? [{ clientId: p.clientId }] : [];
  }
  if (table === deliverableVersionsTable) {
    const fileUrl = eqs["deliverableVersions.fileUrl"] as string | undefined;
    if (!fileUrl) return [];
    const v = state.deliverableVersions.find((dv) => dv.fileUrl === fileUrl);
    if (!v) return [];
    const d = Array.from(state.deliverables.values()).find(
      (dd) => dd.id === v.deliverableId,
    );
    if (!d) return [];
    return [{ id: d.id, projectId: d.projectId, fileUrl: d.fileUrl }];
  }
  return [];
}

function makeQuery(table: unknown) {
  let cond: unknown = null;
  const exec = async () => runQuery(table, cond);
  const builder: Record<string, unknown> = {
    innerJoin() {
      return builder;
    },
    where(c: unknown) {
      cond = c;
      return builder;
    },
    orderBy() {
      return builder;
    },
    limit() {
      return exec();
    },
    then(resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown) {
      return exec().then(resolve, reject);
    },
  };
  return builder;
}

vi.mock("@workspace/db", () => ({
  db: {
    select() {
      return {
        from(table: unknown) {
          return makeQuery(table);
        },
      };
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  usersTable,
  deliverablesTable,
  reviewLinksTable,
  mediaUploadsTable,
  projectsTable,
  projectMembersTable,
  phasesTable: {},
  tasksTable: {},
  taskItemsTable: {},
  reviewsTable: {},
  messagesTable: {},
  contractsTable: {},
  invoicesTable: {},
  videoCommentsTable: {},
  deliverableVersionsTable,
}));

vi.mock("../lib/objectStorage", () => {
  class ObjectNotFoundError extends Error {
    constructor() {
      super("Object not found");
      this.name = "ObjectNotFoundError";
    }
  }
  class ObjectStorageService {
    async getObjectEntityFile(objectPath: string) {
      return { __path: objectPath };
    }
    async downloadObject(file: { __path: string }) {
      return new Response(`stub:${file.__path}`, {
        headers: { "Content-Type": "video/mp4" },
      });
    }
    async searchPublicObject() {
      return null;
    }
    normalizeObjectEntityPath(p: string) {
      return p;
    }
    async getObjectEntityUploadURL() {
      return "http://example.test/upload";
    }
  }
  return { ObjectStorageService, ObjectNotFoundError };
});

const SESSION_COOKIE = "pgtsnd_session";
const JWT_SECRET = "test-jwt-secret";

function sessionCookieFor(user: MockUser): string {
  const token = jwt.sign(
    { userId: user.id, email: `${user.id}@test`, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
  return `${SESSION_COOKIE}=${token}`;
}

let app: Express;
let storageRouter: express.Router;

beforeEach(async () => {
  state.users.clear();
  state.deliverables.clear();
  state.reviewLinks.length = 0;
  state.projectMembers.length = 0;
  state.projects.clear();
  state.mediaUploads.clear();
  state.deliverableVersions.length = 0;

  if (!storageRouter) {
    storageRouter = (await import("../routes/storage")).default;
  }
  app = express();
  app.use(cookieParser());
  app.use("/api", storageRouter);
});

describe("GET /api/storage/objects/* access controls", () => {
  const objectPath = "/objects/uploads/file-abc";
  const fileUrl = `/api/storage${objectPath}`;
  const requestPath = `/api/storage${objectPath}`;
  const projectId = "project-1";
  const deliverableId = "deliverable-1";

  function seedDeliverable() {
    state.deliverables.set(fileUrl, {
      id: deliverableId,
      projectId,
      fileUrl,
    });
  }

  function seedUser(id: string, role: Role): MockUser {
    const u: MockUser = { id, role };
    state.users.set(id, u);
    return u;
  }

  it("allows an owner with a valid session", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });
    const owner = seedUser("user-owner", "owner");

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(200);
  });

  it("allows a partner with a valid session", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });
    const partner = seedUser("user-partner", "partner");

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(partner));

    expect(res.status).toBe(200);
  });

  it("allows a crew member who is on the project", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });
    const crew = seedUser("user-crew-on", "crew");
    state.projectMembers.push({ projectId, userId: crew.id });

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(crew));

    expect(res.status).toBe(200);
  });

  it("denies (403) a crew member who is NOT on the project", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });
    const crew = seedUser("user-crew-off", "crew");

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(crew));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("allows the client of the project", async () => {
    seedDeliverable();
    const client = seedUser("client-on-project", "client");
    state.projects.set(projectId, { clientId: client.id });

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(client));

    expect(res.status).toBe(200);
  });

  it("denies (403) a different client who does not own the project", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });
    const otherClient = seedUser("client-other", "client");

    const res = await request(app)
      .get(requestPath)
      .set("Cookie", sessionCookieFor(otherClient));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("denies (401) an unauthenticated request with no session and no token", async () => {
    seedDeliverable();
    state.projects.set(projectId, { clientId: "client-on-project" });

    const res = await request(app).get(requestPath);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("allows access via a valid (non-expired) review token, even without a session", async () => {
    seedDeliverable();
    state.reviewLinks.push({
      token: "valid-token",
      deliverableId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await request(app).get(`${requestPath}?reviewToken=valid-token`);

    expect(res.status).toBe(200);
  });

  it("allows access via a review token with no expiry", async () => {
    seedDeliverable();
    state.reviewLinks.push({
      token: "perm-token",
      deliverableId,
      expiresAt: null,
    });

    const res = await request(app).get(`${requestPath}?reviewToken=perm-token`);

    expect(res.status).toBe(200);
  });

  it("denies (401) an expired review token when no session is present", async () => {
    seedDeliverable();
    state.reviewLinks.push({
      token: "expired-token",
      deliverableId,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app).get(
      `${requestPath}?reviewToken=expired-token`,
    );

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("denies (401) a review token bound to a different deliverable", async () => {
    seedDeliverable();
    state.reviewLinks.push({
      token: "wrong-deliverable",
      deliverableId: "some-other-deliverable",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await request(app).get(
      `${requestPath}?reviewToken=wrong-deliverable`,
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 when the requested object is not attached to any deliverable or media upload", async () => {
    const owner = seedUser("user-owner-2", "owner");

    const res = await request(app)
      .get("/api/storage/objects/uploads/missing")
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(404);
  });
});
