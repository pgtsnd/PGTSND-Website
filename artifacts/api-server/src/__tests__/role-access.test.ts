import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

type Role = "owner" | "partner" | "crew" | "client";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  initials?: string;
  avatarUrl: string | null;
  googleId: string | null;
}

interface State {
  users: Record<string, UserRow>;
  projects: Record<string, { id: string; clientId: string | null; slackChannelId?: string | null }>;
  members: Array<{ projectId: string; userId: string }>;
  deliverables: Record<string, { id: string; projectId: string; status: string; fileUrl: string | null; version: string | null; uploadedBy: string | null }>;
  reviews: Record<string, { id: string; deliverableId: string }>;
  messages: Record<string, { id: string; projectId: string }>;
}

const state: State = {
  users: {},
  projects: {},
  members: [],
  deliverables: {},
  reviews: {},
  messages: {},
};

function resetState() {
  state.users = {
    "u-owner": { id: "u-owner", email: "owner@x.com", name: "Owner", role: "owner", avatarUrl: null, googleId: null },
    "u-partner": { id: "u-partner", email: "partner@x.com", name: "Partner", role: "partner", avatarUrl: null, googleId: null },
    "u-crew-member": { id: "u-crew-member", email: "crew1@x.com", name: "Crew Member", role: "crew", avatarUrl: null, googleId: null },
    "u-crew-other": { id: "u-crew-other", email: "crew2@x.com", name: "Crew Other", role: "crew", avatarUrl: null, googleId: null },
    "u-client-on": { id: "u-client-on", email: "c1@x.com", name: "Client On", role: "client", avatarUrl: null, googleId: null },
    "u-client-other": { id: "u-client-other", email: "c2@x.com", name: "Client Other", role: "client", avatarUrl: null, googleId: null },
  };
  state.projects = {
    p1: { id: "p1", clientId: "u-client-on", slackChannelId: null },
  };
  state.members = [{ projectId: "p1", userId: "u-crew-member" }];
  state.deliverables = {
    d1: { id: "d1", projectId: "p1", status: "draft", fileUrl: null, version: "v1", uploadedBy: null },
  };
  state.reviews = { r1: { id: "r1", deliverableId: "d1" } };
  state.messages = { m1: { id: "m1", projectId: "p1" } };
}

resetState();

const { tables, passSchema } = vi.hoisted(() => {
  function makeTable(name: string) {
    return new Proxy(
      { __name: name },
      {
        get(_t, prop) {
          if (prop === "__name") return name;
          if (typeof prop === "symbol") return undefined;
          return { __table: name, __col: String(prop) };
        },
      },
    );
  }
  return {
    tables: {
      users: makeTable("users"),
      projects: makeTable("projects"),
      projectMembers: makeTable("projectMembers"),
      deliverables: makeTable("deliverables"),
      deliverableVersions: makeTable("deliverableVersions"),
      reviews: makeTable("reviews"),
      messages: makeTable("messages"),
      videoComments: makeTable("videoComments"),
      phases: makeTable("phases"),
      tasks: makeTable("tasks"),
      taskItems: makeTable("taskItems"),
      contracts: makeTable("contracts"),
      invoices: makeTable("invoices"),
      magicLinkTokens: makeTable("magicLinkTokens"),
    },
    passSchema: {
      safeParse: (d: unknown) => ({ success: true as const, data: d }),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: (col: any, val: any) => ({ op: "eq", col, val }),
    and: (...args: any[]) => ({ op: "and", args }),
    or: (...args: any[]) => ({ op: "or", args }),
    inArray: (col: any, vals: any[]) => ({ op: "in", col, vals }),
    desc: (col: any) => col,
    asc: (col: any) => col,
  };
});

function flatEqs(cond: any): Array<[string, any] | ["__in__", string, any[]]> {
  if (!cond) return [];
  if (cond.op === "and") return cond.args.flatMap(flatEqs);
  if (cond.op === "eq") return [[cond.col?.__col ?? "__unknown__", cond.val]];
  if (cond.op === "in") return [["__in__", cond.col?.__col ?? "__unknown__", cond.vals]];
  return [];
}

function rowMatches(row: any, conds: any[]): boolean {
  for (const cond of conds) {
    const eqs = flatEqs(cond);
    for (const e of eqs) {
      if (e[0] === "__in__") {
        if (!(e[2] as any[]).includes(row[e[1] as string])) return false;
      } else {
        if (row[e[0] as string] !== e[1]) return false;
      }
    }
  }
  return true;
}

function tableRows(tableName: string): any[] {
  switch (tableName) {
    case "users":
      return Object.values(state.users);
    case "projects":
      return Object.values(state.projects);
    case "projectMembers":
      return state.members;
    case "deliverables":
      return Object.values(state.deliverables);
    case "deliverableVersions":
      return [];
    case "reviews":
      return Object.values(state.reviews);
    case "messages":
      return Object.values(state.messages).map((m) => ({
        ...m,
        recipientId: null,
        senderId: "u-owner",
        content: "hi",
        read: false,
        createdAt: new Date(),
      }));
    default:
      return [];
  }
}

interface QueryState {
  table: string | null;
  conditions: any[];
  limit?: number;
}

function buildSelectBuilder() {
  const qs: QueryState = { table: null, conditions: [] };
  const exec = async () => {
    if (!qs.table) return [];
    let rows = tableRows(qs.table);
    rows = rows.filter((r) => rowMatches(r, qs.conditions));
    if (qs.limit !== undefined) rows = rows.slice(0, qs.limit);
    return rows;
  };
  const b: any = {
    from(tbl: any) {
      qs.table = tbl?.__name ?? null;
      return b;
    },
    where(cond: any) {
      qs.conditions.push(cond);
      return b;
    },
    leftJoin() {
      return b;
    },
    orderBy() {
      return b;
    },
    limit(n: number) {
      qs.limit = n;
      return b;
    },
    then(onF: any, onR: any) {
      return exec().then(onF, onR);
    },
    catch(onR: any) {
      return exec().catch(onR);
    },
  };
  return b;
}

function buildInsertBuilder(tbl: any) {
  let inserted: any = null;
  const exec = async () => [inserted];
  const b: any = {
    values(v: any) {
      inserted = { id: `new-${tbl?.__name ?? "row"}-id`, ...v };
      return b;
    },
    returning() {
      return exec();
    },
    then(onF: any, onR: any) {
      return exec().then(onF, onR);
    },
  };
  return b;
}

function buildUpdateBuilder(tbl: any) {
  let setVals: any = {};
  let conds: any[] = [];
  const exec = async () => {
    const rows = tableRows(tbl?.__name ?? "").filter((r) => rowMatches(r, conds));
    return rows.map((r) => ({ ...r, ...setVals }));
  };
  const b: any = {
    set(v: any) {
      setVals = v;
      return b;
    },
    where(c: any) {
      conds.push(c);
      return b;
    },
    returning() {
      return exec();
    },
  };
  return b;
}

function buildDeleteBuilder(tbl: any) {
  let conds: any[] = [];
  const exec = async () => tableRows(tbl?.__name ?? "").filter((r) => rowMatches(r, conds));
  const b: any = {
    where(c: any) {
      conds.push(c);
      return b;
    },
    returning() {
      return exec();
    },
  };
  return b;
}

vi.mock("@workspace/db", () => {
  const db = {
    select: vi.fn(() => buildSelectBuilder()),
    insert: vi.fn((tbl: any) => buildInsertBuilder(tbl)),
    update: vi.fn((tbl: any) => buildUpdateBuilder(tbl)),
    delete: vi.fn((tbl: any) => buildDeleteBuilder(tbl)),
  };
  return {
    db,
    pool: {},
    usersTable: tables.users,
    projectsTable: tables.projects,
    projectMembersTable: tables.projectMembers,
    deliverablesTable: tables.deliverables,
    deliverableVersionsTable: tables.deliverableVersions,
    reviewsTable: tables.reviews,
    messagesTable: tables.messages,
    videoCommentsTable: tables.videoComments,
    phasesTable: tables.phases,
    tasksTable: tables.tasks,
    taskItemsTable: tables.taskItems,
    contractsTable: tables.contracts,
    invoicesTable: tables.invoices,
    magicLinkTokensTable: tables.magicLinkTokens,
    insertProjectSchema: passSchema,
    updateProjectSchema: passSchema,
    insertProjectMemberSchema: passSchema,
    selectProjectSchema: passSchema,
    selectProjectMemberSchema: passSchema,
    insertDeliverableSchema: passSchema,
    updateDeliverableSchema: passSchema,
    selectDeliverableSchema: passSchema,
    selectDeliverableVersionSchema: passSchema,
    insertReviewSchema: passSchema,
    updateReviewSchema: passSchema,
    selectReviewSchema: passSchema,
    insertMessageSchema: passSchema,
    selectMessageSchema: passSchema,
    enrichedMessageSchema: passSchema,
  };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: tables.users,
  magicLinkTokensTable: tables.magicLinkTokens,
}));

vi.mock("../services/notifications", () => ({
  notifyClientWelcomeIfFirstProject: vi.fn(async () => undefined),
  notifyDeliverableSubmittedForReview: vi.fn(async () => undefined),
}));

vi.mock("../services/slack", () => ({
  isSlackConnected: vi.fn(async () => false),
  getChannelHistory: vi.fn(async () => []),
  getUserInfo: vi.fn(async () => null),
}));

vi.mock("../lib/access-tokens", () => ({
  isAccessTokenActive: vi.fn(async () => true),
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

async function obtainCsrfToken(): Promise<string> {
  const res = await request(appModule).get("/api/auth/me");
  const token = readSetCookies(res.headers["set-cookie"])[CSRF_COOKIE_NAME];
  if (!token) throw new Error("expected CSRF cookie");
  return token;
}

function signSessionFor(userId: string): string {
  const u = state.users[userId];
  return jwt.sign(
    { userId: u.id, email: u.email, role: u.role },
    "test-jwt-secret",
    { expiresIn: "7d" },
  );
}

interface SendOpts {
  method: "get" | "post" | "patch" | "delete";
  path: string;
  userId: string;
  body?: unknown;
}

async function send({ method, path, userId, body }: SendOpts) {
  const csrf = await obtainCsrfToken();
  const session = signSessionFor(userId);
  const cookieHeader = `${CSRF_COOKIE_NAME}=${csrf}; ${SESSION_COOKIE}=${session}`;
  let req = request(appModule)[method](path).set("Cookie", cookieHeader);
  if (method !== "get") req = req.set(CSRF_HEADER_NAME, csrf);
  return body !== undefined ? req.send(body) : req;
}

beforeAll(() => {
  // ensure app is loaded
  void appModule;
});

beforeEach(() => {
  resetState();
});

describe("requireRole — disallowed roles get 403 'Insufficient permissions'", () => {
  it("client cannot DELETE /api/projects/:id (owner-only)", async () => {
    const res = await send({ method: "delete", path: "/api/projects/p1", userId: "u-client-on" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });

  it("crew cannot POST /api/projects (owner/partner only)", async () => {
    const res = await send({
      method: "post",
      path: "/api/projects",
      userId: "u-crew-member",
      body: { name: "x" },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });

  it("client cannot POST /api/projects/:id/deliverables (owner/partner/crew only)", async () => {
    const res = await send({
      method: "post",
      path: "/api/projects/p1/deliverables",
      userId: "u-client-on",
      body: { title: "x" },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });

  it("crew cannot POST /api/deliverables/:id/reviews (owner/partner/client only)", async () => {
    const res = await send({
      method: "post",
      path: "/api/deliverables/d1/reviews",
      userId: "u-crew-member",
      body: { status: "approved" },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });

  it("crew cannot DELETE /api/messages/:id (owner/partner only)", async () => {
    const res = await send({
      method: "delete",
      path: "/api/messages/m1",
      userId: "u-crew-member",
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });

  it("client cannot DELETE /api/deliverables/:id (owner/partner only)", async () => {
    const res = await send({
      method: "delete",
      path: "/api/deliverables/d1",
      userId: "u-client-on",
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
  });
});

describe("requireRole — allowed roles succeed", () => {
  it("owner can POST /api/projects → 201", async () => {
    const res = await send({
      method: "post",
      path: "/api/projects",
      userId: "u-owner",
      body: { name: "New" },
    });
    expect(res.status).toBe(201);
  });

  it("crew (project member) can POST /api/projects/:id/deliverables → 201", async () => {
    const res = await send({
      method: "post",
      path: "/api/projects/p1/deliverables",
      userId: "u-crew-member",
      body: { title: "Cut 1" },
    });
    expect(res.status).toBe(201);
  });

  it("client (matching project clientId) can POST /api/deliverables/:id/reviews → 201", async () => {
    const res = await send({
      method: "post",
      path: "/api/deliverables/d1/reviews",
      userId: "u-client-on",
      body: { status: "approved" },
    });
    expect(res.status).toBe(201);
  });

  it("partner can DELETE /api/messages/:id → 200", async () => {
    const res = await send({
      method: "delete",
      path: "/api/messages/m1",
      userId: "u-partner",
    });
    expect(res.status).toBe(200);
  });
});

describe("requireProjectAccess — rejects users not associated with the project", () => {
  it("crew NOT on project gets 403 'Access denied' on GET /api/projects/:id/deliverables", async () => {
    const res = await send({
      method: "get",
      path: "/api/projects/p1/deliverables",
      userId: "u-crew-other",
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("client NOT the project's client gets 403 on GET /api/projects/:id/messages", async () => {
    const res = await send({
      method: "get",
      path: "/api/projects/p1/messages",
      userId: "u-client-other",
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("crew NOT on project gets 403 trying to POST a deliverable on that project", async () => {
    // requireRole passes (crew is allowed), but requireProjectAccess blocks
    const res = await send({
      method: "post",
      path: "/api/projects/p1/deliverables",
      userId: "u-crew-other",
      body: { title: "x" },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });

  it("crew on project gets 200 on GET /api/projects/:id/deliverables", async () => {
    const res = await send({
      method: "get",
      path: "/api/projects/p1/deliverables",
      userId: "u-crew-member",
    });
    expect(res.status).toBe(200);
  });

  it("client matching clientId gets 200 on GET /api/projects/:id/messages", async () => {
    const res = await send({
      method: "get",
      path: "/api/projects/p1/messages",
      userId: "u-client-on",
    });
    expect(res.status).toBe(200);
  });

  it("owner bypasses project membership check (200 on a project they're not a member of)", async () => {
    const res = await send({
      method: "get",
      path: "/api/projects/p1/deliverables",
      userId: "u-owner",
    });
    expect(res.status).toBe(200);
  });
});
