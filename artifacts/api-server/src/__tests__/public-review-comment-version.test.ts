import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

interface ReviewLink {
  id: string;
  token: string;
  deliverableId: string;
  expiresAt: Date | null;
}
interface DeliverableVersion {
  id: string;
  deliverableId: string;
  version: string;
  fileUrl: string;
  uploadedById: string | null;
  createdAt: Date;
}
interface VideoComment {
  id: string;
  deliverableId: string;
  deliverableVersionId: string | null;
  versionLabel: string | null;
  authorId: string | null;
  authorName: string;
  timestampSeconds: number;
  content: string;
  createdAt: Date;
}

const reviewLinksTable = { id: "rl.id", token: "rl.token", deliverableId: "rl.deliverableId" };
const deliverableVersionsTable = {
  id: "dv.id",
  deliverableId: "dv.deliverableId",
  createdAt: "dv.createdAt",
};
const videoCommentsTable = { id: "vc.id" };
const videoCommentRepliesTable = { id: "vcr.id", commentId: "vcr.commentId" };
const deliverablesTable = { id: "d.id" };
const projectsTable = { id: "p.id" };
const usersTable = { id: "u.id" };

const state = {
  reviewLinks: new Map<string, ReviewLink>(),
  versions: new Map<string, DeliverableVersion>(),
  comments: [] as VideoComment[],
  insertedComments: [] as Partial<VideoComment>[],
  nextCommentId: 1,
};

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: unknown) => ({ _op: "eq", col, val }),
  and: (...args: unknown[]) => ({ _op: "and", args }),
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

interface OrderBy {
  col?: string;
  dir?: "asc" | "desc";
}

function runSelect(table: unknown, cond: unknown, order: OrderBy): unknown[] {
  const eqs = extractEqs(cond);
  if (table === reviewLinksTable) {
    const token = eqs["rl.token"] as string | undefined;
    if (!token) return [];
    const link = state.reviewLinks.get(token);
    return link ? [link] : [];
  }
  if (table === deliverableVersionsTable) {
    const id = eqs["dv.id"] as string | undefined;
    const delId = eqs["dv.deliverableId"] as string | undefined;
    let rows = Array.from(state.versions.values());
    if (id) rows = rows.filter((v) => v.id === id);
    if (delId) rows = rows.filter((v) => v.deliverableId === delId);
    if (order.col === "dv.createdAt" && order.dir === "desc") {
      rows = rows.slice().sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }
    return rows;
  }
  if (table === deliverablesTable || table === projectsTable || table === usersTable) {
    return [];
  }
  if (table === videoCommentsTable) {
    return state.comments.slice();
  }
  if (table === videoCommentRepliesTable) {
    return [];
  }
  return [];
}

function makeSelectFrom(table: unknown) {
  let cond: unknown = null;
  let order: OrderBy = {};
  const exec = async () => runSelect(table, cond, order);
  const builder: Record<string, unknown> = {
    where(c: unknown) {
      cond = c;
      return builder;
    },
    orderBy(o: { _op?: string; col?: string }) {
      if (o && o._op && o.col) order = { col: o.col, dir: o._op as "asc" | "desc" };
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

function makeInsert(table: unknown) {
  let values: Partial<VideoComment> = {};
  const exec = async () => {
    if (table === videoCommentsTable) {
      const row: VideoComment = {
        id: `c-${state.nextCommentId++}`,
        deliverableId: values.deliverableId as string,
        deliverableVersionId: values.deliverableVersionId ?? null,
        versionLabel: values.versionLabel ?? null,
        authorId: values.authorId ?? null,
        authorName: values.authorName as string,
        timestampSeconds: values.timestampSeconds as number,
        content: values.content as string,
        createdAt: new Date(),
      };
      state.insertedComments.push({ ...values });
      state.comments.push(row);
      return [row];
    }
    return [];
  };
  const builder: Record<string, unknown> = {
    values(v: Partial<VideoComment>) {
      values = v;
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
    insert(table: unknown) {
      return makeInsert(table);
    },
    update: vi.fn(),
    delete: vi.fn(),
  },
  reviewLinksTable,
  deliverablesTable,
  deliverableVersionsTable,
  projectsTable,
  usersTable,
  videoCommentsTable,
  videoCommentRepliesTable,
}));

const notifySpy = vi.fn(async () => undefined);
vi.mock("../services/notifications", () => ({
  notifyPublicReviewComment: (...args: unknown[]) => notifySpy(...args),
}));

let app: Express;

beforeEach(async () => {
  state.reviewLinks.clear();
  state.versions.clear();
  state.comments.length = 0;
  state.insertedComments.length = 0;
  state.nextCommentId = 1;
  notifySpy.mockClear();

  const router = (await import("../routes/public-review")).default;
  app = express();
  app.use(express.json());
  app.use("/api", router);
});

const TOKEN = "tok-public-1";
const DELIVERABLE_ID = "del-1";

function seed() {
  state.reviewLinks.set(TOKEN, {
    id: "rl-1",
    token: TOKEN,
    deliverableId: DELIVERABLE_ID,
    expiresAt: null,
  });
  state.versions.set("ver-2", {
    id: "ver-2",
    deliverableId: DELIVERABLE_ID,
    version: "v2",
    fileUrl: "/v2.mp4",
    uploadedById: null,
    createdAt: new Date("2026-02-01"),
  });
  state.versions.set("ver-1", {
    id: "ver-1",
    deliverableId: DELIVERABLE_ID,
    version: "v1",
    fileUrl: "/v1.mp4",
    uploadedById: null,
    createdAt: new Date("2026-01-01"),
  });
  // A version belonging to a different deliverable — must be rejected.
  state.versions.set("foreign", {
    id: "foreign",
    deliverableId: "other-deliverable",
    version: "vX",
    fileUrl: "/x.mp4",
    uploadedById: null,
    createdAt: new Date("2026-03-01"),
  });
}

describe("POST /api/public/review/:token/comments — deliverableVersionId routing", () => {
  it("tags the inserted comment with the supplied deliverableVersionId when it belongs to this deliverable", async () => {
    seed();

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({
        timestampSeconds: 7,
        content: "B-side note",
        authorName: "Alice",
        deliverableVersionId: "ver-1",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      deliverableId: DELIVERABLE_ID,
      deliverableVersionId: "ver-1",
      versionLabel: "v1",
      timestampSeconds: 7,
      content: "B-side note",
      authorName: "Alice",
      authorId: null,
      replies: [],
    });
    expect(state.insertedComments[0]).toMatchObject({
      deliverableVersionId: "ver-1",
      versionLabel: "v1",
    });
  });

  it("falls back to the latest version's id when no deliverableVersionId is provided", async () => {
    seed();

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({
        timestampSeconds: 3,
        content: "Latest by default",
        authorName: "Alice",
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverableVersionId).toBe("ver-2");
    expect(res.body.versionLabel).toBe("v2");
  });

  it("rejects deliverableVersionId from a different deliverable with a 400", async () => {
    seed();

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({
        timestampSeconds: 4,
        content: "no",
        authorName: "Alice",
        deliverableVersionId: "foreign",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "deliverableVersionId does not belong to this deliverable",
    });
    expect(state.insertedComments).toHaveLength(0);
    expect(state.comments).toHaveLength(0);
  });

  it("treats an empty-string deliverableVersionId as omitted and falls back to latest", async () => {
    seed();

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({
        timestampSeconds: 1,
        content: "fallback",
        authorName: "Alice",
        deliverableVersionId: "",
      });

    expect(res.status).toBe(201);
    expect(res.body.deliverableVersionId).toBe("ver-2");
  });

  it("returns 404 when the review token is unknown", async () => {
    const res = await request(app)
      .post(`/api/public/review/unknown/comments`)
      .send({
        timestampSeconds: 1,
        content: "x",
        authorName: "Alice",
        deliverableVersionId: "ver-1",
      });

    expect(res.status).toBe(404);
    expect(state.insertedComments).toHaveLength(0);
  });

  it("returns 410 when the review link has expired", async () => {
    seed();
    const link = state.reviewLinks.get(TOKEN)!;
    state.reviewLinks.set(TOKEN, {
      ...link,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({
        timestampSeconds: 1,
        content: "x",
        authorName: "Alice",
        deliverableVersionId: "ver-1",
      });

    expect(res.status).toBe(410);
  });

  it("returns 400 when required fields are missing", async () => {
    seed();

    const res = await request(app)
      .post(`/api/public/review/${TOKEN}/comments`)
      .send({ timestampSeconds: 1, content: "", authorName: "Alice" });

    expect(res.status).toBe(400);
  });
});
