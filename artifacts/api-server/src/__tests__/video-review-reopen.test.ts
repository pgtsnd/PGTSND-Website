import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";

type Role = "owner" | "partner" | "crew" | "client";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

interface MockProject {
  id: string;
  clientId: string | null;
}

interface MockDeliverable {
  id: string;
  projectId: string;
}

interface MockComment {
  id: string;
  deliverableId: string;
  deliverableVersionId: string | null;
  versionLabel: string | null;
  authorId: string | null;
  authorName: string;
  timestampSeconds: number;
  content: string;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedNote: string | null;
  reopenedAt?: Date | null;
  reopenedBy?: string | null;
  reopenedByName?: string | null;
  previousResolvedAt?: Date | null;
  previousResolvedByName?: string | null;
  previousResolvedNote?: string | null;
}

interface MockProjectMember {
  projectId: string;
  userId: string;
}

const state = {
  users: new Map<string, MockUser>(),
  projects: new Map<string, MockProject>(),
  deliverables: new Map<string, MockDeliverable>(),
  comments: new Map<string, MockComment>(),
  members: [] as MockProjectMember[],
};

const usersTable = {
  id: "users.id",
  email: "users.email",
  name: "users.name",
  role: "users.role",
  avatarUrl: "users.avatarUrl",
};
const videoCommentsTable = {
  id: "videoComments.id",
  deliverableId: "videoComments.deliverableId",
  authorId: "videoComments.authorId",
  resolvedAt: "videoComments.resolvedAt",
};
const videoCommentRepliesTable = {
  id: "videoCommentReplies.id",
  commentId: "videoCommentReplies.commentId",
  createdAt: "videoCommentReplies.createdAt",
};
const reviewLinksTable = {
  id: "reviewLinks.id",
  deliverableId: "reviewLinks.deliverableId",
};
const deliverablesTable = {
  id: "deliverables.id",
  projectId: "deliverables.projectId",
  version: "deliverables.version",
};
const deliverableVersionsTable = {
  id: "deliverableVersions.id",
  deliverableId: "deliverableVersions.deliverableId",
  createdAt: "deliverableVersions.createdAt",
};
const projectsTable = { id: "projects.id", clientId: "projects.clientId" };
const projectMembersTable = {
  projectId: "projectMembers.projectId",
  userId: "projectMembers.userId",
};

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: unknown) => ({ _op: "eq", col, val }),
  and: (...args: unknown[]) => ({ _op: "and", args }),
  or: (...args: unknown[]) => ({ _op: "or", args }),
  asc: (col: string) => ({ _op: "asc", col }),
  desc: (col: string) => ({ _op: "desc", col }),
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
  if (table === videoCommentsTable) {
    const id = eqs["videoComments.id"] as string | undefined;
    if (id) {
      const c = state.comments.get(id);
      return c ? [c] : [];
    }
    return [];
  }
  if (table === deliverablesTable) {
    const id = eqs["deliverables.id"] as string | undefined;
    if (!id) return [];
    const d = state.deliverables.get(id);
    return d ? [d] : [];
  }
  if (table === projectsTable) {
    const id = eqs["projects.id"] as string | undefined;
    if (!id) return [];
    const p = state.projects.get(id);
    return p ? [p] : [];
  }
  if (table === projectMembersTable) {
    const projectId = eqs["projectMembers.projectId"] as string | undefined;
    const userId = eqs["projectMembers.userId"] as string | undefined;
    return state.members.filter(
      (m) => m.projectId === projectId && m.userId === userId,
    );
  }
  return [];
}

function makeSelectFrom(table: unknown) {
  let cond: unknown = null;
  const exec = async () => runQuery(table, cond);
  const builder: Record<string, unknown> = {
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

function makeUpdate(table: unknown) {
  let setValues: Record<string, unknown> = {};
  let cond: unknown = null;
  const exec = async () => {
    if (table === videoCommentsTable) {
      const id = extractEqs(cond)["videoComments.id"] as string | undefined;
      if (!id) return [];
      const existing = state.comments.get(id);
      if (!existing) return [];
      const updated = { ...existing, ...setValues } as MockComment;
      state.comments.set(id, updated);
      return [updated];
    }
    return [];
  };
  const builder: Record<string, unknown> = {
    set(v: Record<string, unknown>) {
      setValues = v;
      return builder;
    },
    where(c: unknown) {
      cond = c;
      return builder;
    },
    returning() {
      return exec();
    },
  };
  return builder;
}

vi.mock("@workspace/db", () => ({
  db: {
    select() {
      return {
        from(table: unknown) {
          return makeSelectFrom(table);
        },
      };
    },
    insert: vi.fn(),
    update(table: unknown) {
      return makeUpdate(table);
    },
    delete: vi.fn(),
  },
  usersTable,
  videoCommentsTable,
  videoCommentRepliesTable,
  reviewLinksTable,
  deliverablesTable,
  deliverableVersionsTable,
  projectsTable,
  projectMembersTable,
  phasesTable: {},
  tasksTable: {},
  taskItemsTable: {},
  reviewsTable: {},
  messagesTable: {},
  contractsTable: {},
  invoicesTable: {},
  selectVideoCommentSchema: {},
  selectVideoCommentReplySchema: {},
  selectReviewLinkSchema: {},
}));

vi.mock("../services/notifications", () => ({
  notifyNewVideoComment: vi.fn(async () => undefined),
  notifyVideoCommentResolved: vi.fn(async () => undefined),
  notifyVideoCommentReopened: vi.fn(async () => undefined),
}));

const SESSION_COOKIE = "pgtsnd_session";
const JWT_SECRET = "test-jwt-secret";

function sessionCookieFor(user: MockUser): string {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
  return `${SESSION_COOKIE}=${token}`;
}

let app: Express;

beforeEach(async () => {
  state.users.clear();
  state.projects.clear();
  state.deliverables.clear();
  state.comments.clear();
  state.members.length = 0;

  const { authMiddleware } = await import("../middleware/auth");
  const videoReviewRouter = (await import("../routes/video-review")).default;

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(authMiddleware);
  app.use("/api", videoReviewRouter);
});

function seedUser(id: string, role: Role, name = id): MockUser {
  const u: MockUser = {
    id,
    name,
    email: `${id}@test`,
    role,
    avatarUrl: null,
  };
  state.users.set(id, u);
  return u;
}

const projectId = "project-1";
const deliverableId = "deliverable-1";
const commentId = "comment-1";
const authorId = "client-author";

function seedResolvedComment(overrides: Partial<MockComment> = {}): MockComment {
  state.projects.set(projectId, { id: projectId, clientId: authorId });
  state.deliverables.set(deliverableId, { id: deliverableId, projectId });
  const comment: MockComment = {
    id: commentId,
    deliverableId,
    deliverableVersionId: null,
    versionLabel: "v1",
    authorId,
    authorName: "Client Author",
    timestampSeconds: 12,
    content: "needs work",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    resolvedAt: new Date("2026-01-02T00:00:00Z"),
    resolvedBy: "user-owner",
    resolvedByName: "Owner",
    resolvedNote: "fixed",
    resolvedAt_overridden: undefined as never,
    ...overrides,
  };
  // Ensure the spread doesn't carry the stray helper key.
  delete (comment as Record<string, unknown>).resolvedAt_overridden;
  state.comments.set(commentId, comment);
  return comment;
}

describe("POST /api/comments/:commentId/reopen", () => {
  it("allows an owner to reopen a resolved comment (200) and clears resolution fields", async () => {
    seedResolvedComment();
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(commentId);
    expect(res.body.resolvedAt).toBeNull();
    expect(res.body.resolvedBy).toBeNull();
    expect(res.body.resolvedByName).toBeNull();
    expect(res.body.resolvedNote).toBeNull();
    // Persisted state was actually updated.
    expect(state.comments.get(commentId)?.resolvedAt).toBeNull();
  });

  it("allows a partner to reopen a resolved comment (200)", async () => {
    seedResolvedComment();
    seedUser(authorId, "client", "Client Author");
    const partner = seedUser("user-partner", "partner");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(partner));

    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeNull();
  });

  it("allows a crew member assigned to the project to reopen (200)", async () => {
    seedResolvedComment();
    seedUser(authorId, "client", "Client Author");
    const crew = seedUser("user-crew", "crew");
    state.members.push({ projectId, userId: crew.id });

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(crew));

    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeNull();
  });

  it("allows the original author (client) to reopen their own comment (200)", async () => {
    seedResolvedComment();
    const author = seedUser(authorId, "client", "Client Author");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(author));

    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeNull();
  });

  it("returns 403 (route-level) when the project's client is NOT the comment author", async () => {
    // Re-point the project at a different client so they pass the project-access
    // middleware, but they didn't author the comment.
    seedResolvedComment();
    state.projects.set(projectId, { id: projectId, clientId: "client-other" });
    const otherClient = seedUser("client-other", "client", "Other Client");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(otherClient));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Only the original author or team can reopen a comment",
    });
    // Comment is unchanged.
    expect(state.comments.get(commentId)?.resolvedAt).not.toBeNull();
  });

  it("returns 403 (project-access middleware) for a client with no relationship to the project", async () => {
    seedResolvedComment();
    const stranger = seedUser("client-stranger", "client", "Stranger");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(stranger));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
    expect(state.comments.get(commentId)?.resolvedAt).not.toBeNull();
  });

  it("returns 403 for a crew member who is not assigned to the project", async () => {
    seedResolvedComment();
    seedUser(authorId, "client", "Client Author");
    const crew = seedUser("user-crew-off", "crew");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(crew));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("returns 401 when no session cookie is present", async () => {
    seedResolvedComment();

    const res = await request(app).post(`/api/comments/${commentId}/reopen`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("returns 404 when the comment does not exist", async () => {
    const owner = seedUser("user-owner", "owner");

    const res = await request(app)
      .post(`/api/comments/does-not-exist/reopen`)
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(404);
  });

  it("is a no-op (returns the comment unchanged) when the comment is already not resolved", async () => {
    seedResolvedComment({
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedNote: null,
    });
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner");

    const before = state.comments.get(commentId);
    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(commentId);
    expect(res.body.resolvedAt).toBeNull();
    // The handler short-circuits before issuing an update, so state is the
    // same object reference we observed beforehand.
    expect(state.comments.get(commentId)).toBe(before);
    // Importantly: a no-op must NOT manufacture a fake reopen audit trail.
    expect(res.body.reopenedAt ?? null).toBeNull();
    expect(res.body.reopenedBy ?? null).toBeNull();
    expect(res.body.reopenedByName ?? null).toBeNull();
    expect(res.body.previousResolvedAt ?? null).toBeNull();
    expect(res.body.previousResolvedByName ?? null).toBeNull();
    expect(res.body.previousResolvedNote ?? null).toBeNull();
  });

  it("populates reopenedAt/reopenedBy/reopenedByName and previous-resolution snapshot fields", async () => {
    const priorResolvedAt = new Date("2026-01-02T00:00:00Z");
    seedResolvedComment({
      resolvedAt: priorResolvedAt,
      resolvedBy: "user-owner-prior",
      resolvedByName: "Prior Owner",
      resolvedNote: "looked good to me",
    });
    seedUser(authorId, "client", "Client Author");
    const partner = seedUser("user-partner", "partner", "Pat Partner");

    const before = Date.now();
    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(partner));
    const after = Date.now();

    expect(res.status).toBe(200);
    // Current resolution cleared.
    expect(res.body.resolvedAt).toBeNull();
    expect(res.body.resolvedBy).toBeNull();
    expect(res.body.resolvedByName).toBeNull();
    expect(res.body.resolvedNote).toBeNull();
    // Reopen actor recorded.
    expect(res.body.reopenedBy).toBe(partner.id);
    expect(res.body.reopenedByName).toBe(partner.name);
    expect(typeof res.body.reopenedAt).toBe("string");
    const reopenedAtMs = new Date(res.body.reopenedAt as string).getTime();
    expect(reopenedAtMs).toBeGreaterThanOrEqual(before);
    expect(reopenedAtMs).toBeLessThanOrEqual(after);
    // Prior resolution snapshot preserved verbatim.
    expect(new Date(res.body.previousResolvedAt as string).toISOString()).toBe(
      priorResolvedAt.toISOString(),
    );
    expect(res.body.previousResolvedByName).toBe("Prior Owner");
    expect(res.body.previousResolvedNote).toBe("looked good to me");

    // And the same is persisted to "the database".
    const persisted = state.comments.get(commentId)!;
    expect(persisted.resolvedAt).toBeNull();
    expect(persisted.reopenedBy).toBe(partner.id);
    expect(persisted.reopenedByName).toBe(partner.name);
    expect(persisted.previousResolvedAt?.toISOString()).toBe(
      priorResolvedAt.toISOString(),
    );
    expect(persisted.previousResolvedByName).toBe("Prior Owner");
    expect(persisted.previousResolvedNote).toBe("looked good to me");
  });

  it("preserves a null previous resolution note in the snapshot when the prior resolve had no note", async () => {
    seedResolvedComment({
      resolvedAt: new Date("2026-01-02T00:00:00Z"),
      resolvedBy: "user-owner-prior",
      resolvedByName: "Prior Owner",
      resolvedNote: null,
    });
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner");

    const res = await request(app)
      .post(`/api/comments/${commentId}/reopen`)
      .set("Cookie", sessionCookieFor(owner));

    expect(res.status).toBe(200);
    expect(res.body.previousResolvedByName).toBe("Prior Owner");
    expect(res.body.previousResolvedNote).toBeNull();
  });
});

describe("PATCH /api/comments/:commentId/resolve with resolved=false", () => {
  it("captures the reopen actor and the prior-resolution snapshot when toggling a resolved comment back to unresolved", async () => {
    const priorResolvedAt = new Date("2026-01-02T00:00:00Z");
    seedResolvedComment({
      resolvedAt: priorResolvedAt,
      resolvedBy: "user-owner-prior",
      resolvedByName: "Prior Owner",
      resolvedNote: "approved on first pass",
    });
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner", "Olivia Owner");

    const before = Date.now();
    const res = await request(app)
      .patch(`/api/comments/${commentId}/resolve`)
      .set("Cookie", sessionCookieFor(owner))
      .send({ resolved: false });
    const after = Date.now();

    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeNull();
    expect(res.body.resolvedBy).toBeNull();
    expect(res.body.resolvedByName).toBeNull();
    expect(res.body.resolvedNote).toBeNull();
    expect(res.body.reopenedBy).toBe(owner.id);
    expect(res.body.reopenedByName).toBe(owner.name);
    const reopenedAtMs = new Date(res.body.reopenedAt as string).getTime();
    expect(reopenedAtMs).toBeGreaterThanOrEqual(before);
    expect(reopenedAtMs).toBeLessThanOrEqual(after);
    expect(new Date(res.body.previousResolvedAt as string).toISOString()).toBe(
      priorResolvedAt.toISOString(),
    );
    expect(res.body.previousResolvedByName).toBe("Prior Owner");
    expect(res.body.previousResolvedNote).toBe("approved on first pass");
  });

  it("does NOT manufacture a reopen snapshot when the comment was not previously resolved (no false history)", async () => {
    // Seed an unresolved comment.
    seedResolvedComment({
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      resolvedNote: null,
    });
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner");

    const res = await request(app)
      .patch(`/api/comments/${commentId}/resolve`)
      .set("Cookie", sessionCookieFor(owner))
      .send({ resolved: false });

    expect(res.status).toBe(200);
    expect(res.body.resolvedAt).toBeNull();
    // No prior resolution existed, so no audit trail should be stamped.
    expect(res.body.reopenedAt ?? null).toBeNull();
    expect(res.body.reopenedBy ?? null).toBeNull();
    expect(res.body.reopenedByName ?? null).toBeNull();
    expect(res.body.previousResolvedAt ?? null).toBeNull();
    expect(res.body.previousResolvedByName ?? null).toBeNull();
    expect(res.body.previousResolvedNote ?? null).toBeNull();

    const persisted = state.comments.get(commentId)!;
    expect(persisted.reopenedAt ?? null).toBeNull();
    expect(persisted.reopenedBy ?? null).toBeNull();
    expect(persisted.previousResolvedAt ?? null).toBeNull();
    expect(persisted.previousResolvedByName ?? null).toBeNull();
    expect(persisted.previousResolvedNote ?? null).toBeNull();
  });

  it("does not stamp reopen fields when re-resolving an already-resolved comment (resolved=true is unaffected)", async () => {
    seedResolvedComment({
      resolvedAt: new Date("2026-01-02T00:00:00Z"),
      resolvedBy: "user-owner-prior",
      resolvedByName: "Prior Owner",
      resolvedNote: "first pass",
    });
    seedUser(authorId, "client", "Client Author");
    const owner = seedUser("user-owner", "owner", "Olivia Owner");

    const res = await request(app)
      .patch(`/api/comments/${commentId}/resolve`)
      .set("Cookie", sessionCookieFor(owner))
      .send({ resolved: true, note: "still good" });

    expect(res.status).toBe(200);
    expect(res.body.resolvedBy).toBe(owner.id);
    expect(res.body.resolvedByName).toBe(owner.name);
    expect(res.body.resolvedNote).toBe("still good");
    // Resolving must never touch the reopen audit trail.
    expect(res.body.reopenedAt ?? null).toBeNull();
    expect(res.body.previousResolvedAt ?? null).toBeNull();
  });
});
