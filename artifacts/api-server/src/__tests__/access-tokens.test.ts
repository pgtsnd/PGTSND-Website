import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgres://unused-in-tests";
process.env.NODE_ENV = "test";

type Role = "owner" | "partner" | "crew" | "client";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatarUrl: string | null;
  googleId: string | null;
}

interface AccessTokenRow {
  id: string;
  userId: string;
  label: string;
  tokenHash: string;
  status: "active" | "revoked";
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdBy: string | null;
  revokedBy: string | null;
}

interface State {
  users: Record<string, UserRow>;
  accessTokens: Record<string, AccessTokenRow>;
  magicLinkTokens: Record<string, unknown>;
  nextId: number;
}

const state: State = {
  users: {},
  accessTokens: {},
  magicLinkTokens: {},
  nextId: 1,
};

function freshId(prefix: string): string {
  state.nextId += 1;
  return `${prefix}-${state.nextId}`;
}

function resetState() {
  state.users = {
    "u-owner": {
      id: "u-owner",
      email: "owner@x.com",
      name: "Owner",
      role: "owner",
      avatarUrl: null,
      googleId: null,
    },
    "u-partner": {
      id: "u-partner",
      email: "partner@x.com",
      name: "Partner",
      role: "partner",
      avatarUrl: null,
      googleId: null,
    },
    "u-crew": {
      id: "u-crew",
      email: "crew@x.com",
      name: "Crew",
      role: "crew",
      avatarUrl: null,
      googleId: null,
    },
    "u-client": {
      id: "u-client",
      email: "client@x.com",
      name: "Client",
      role: "client",
      avatarUrl: null,
      googleId: null,
    },
    "u-target": {
      id: "u-target",
      email: "tokenuser@x.com",
      name: "Token User",
      role: "client",
      avatarUrl: null,
      googleId: null,
    },
  };
  state.accessTokens = {};
  state.magicLinkTokens = {};
  state.nextId = 100;
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
      accessTokens: makeTable("accessTokens"),
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

function tableStore(name: string): Record<string, any> {
  switch (name) {
    case "users":
      return state.users as any;
    case "accessTokens":
      return state.accessTokens as any;
    case "magicLinkTokens":
      return state.magicLinkTokens as any;
    default:
      return {};
  }
}

function isColRef(v: any): boolean {
  return v && typeof v === "object" && "__table" in v && "__col" in v;
}

function readColumn(joinedRow: Record<string, any>, ref: any): any {
  return joinedRow[ref.__table]?.[ref.__col];
}

function evalCond(cond: any, joinedRow: Record<string, any>): boolean {
  if (!cond) return true;
  if (cond.op === "and") return cond.args.every((c: any) => evalCond(c, joinedRow));
  if (cond.op === "or") return cond.args.some((c: any) => evalCond(c, joinedRow));
  if (cond.op === "eq") {
    const a = isColRef(cond.col) ? readColumn(joinedRow, cond.col) : cond.col;
    const b = isColRef(cond.val) ? readColumn(joinedRow, cond.val) : cond.val;
    return a === b;
  }
  if (cond.op === "in") {
    const a = isColRef(cond.col) ? readColumn(joinedRow, cond.col) : cond.col;
    return (cond.vals as any[]).includes(a);
  }
  return true;
}

interface SelectQS {
  projection: Record<string, any> | null;
  base: { __name: string } | null;
  joins: Array<{ table: { __name: string }; cond: any }>;
  conditions: any[];
  limitN?: number;
}

function buildSelect(projection: Record<string, any> | null) {
  const qs: SelectQS = { projection, base: null, joins: [], conditions: [] };
  const exec = async () => {
    if (!qs.base) return [];
    let rows: Array<Record<string, any>> = Object.values(tableStore(qs.base.__name)).map(
      (r) => ({ [qs.base!.__name]: r }),
    );
    for (const j of qs.joins) {
      const next: Array<Record<string, any>> = [];
      for (const r of rows) {
        for (const jr of Object.values(tableStore(j.table.__name))) {
          const candidate = { ...r, [j.table.__name]: jr };
          if (evalCond(j.cond, candidate)) next.push(candidate);
        }
      }
      rows = next;
    }
    rows = rows.filter((r) => qs.conditions.every((c) => evalCond(c, r)));
    if (qs.limitN !== undefined) rows = rows.slice(0, qs.limitN);
    if (!qs.projection) {
      // return rows from base table
      return rows.map((r) => ({ ...(r[qs.base!.__name] as object) }));
    }
    return rows.map((r) => {
      const out: Record<string, any> = {};
      for (const [k, ref] of Object.entries(qs.projection!)) {
        out[k] = isColRef(ref) ? readColumn(r, ref) ?? null : ref;
      }
      return out;
    });
  };

  const b: any = {
    from(tbl: any) {
      qs.base = tbl;
      return b;
    },
    innerJoin(tbl: any, cond: any) {
      qs.joins.push({ table: tbl, cond });
      return b;
    },
    leftJoin(tbl: any, cond: any) {
      qs.joins.push({ table: tbl, cond });
      return b;
    },
    where(cond: any) {
      qs.conditions.push(cond);
      return b;
    },
    orderBy() {
      return b;
    },
    limit(n: number) {
      qs.limitN = n;
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

function buildInsert(tbl: { __name: string }) {
  let row: any = null;
  const exec = async () => [row];
  const b: any = {
    values(v: any) {
      const id = v.id ?? freshId(tbl.__name);
      row = {
        id,
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: null,
        revokedBy: null,
        status: "active",
        ...v,
      };
      tableStore(tbl.__name)[id] = row;
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

function buildUpdate(tbl: { __name: string }) {
  let setVals: any = {};
  const conds: any[] = [];
  const exec = async () => {
    const out: any[] = [];
    const store = tableStore(tbl.__name);
    for (const [k, r] of Object.entries(store)) {
      const joined = { [tbl.__name]: r };
      if (conds.every((c) => evalCond(c, joined))) {
        store[k] = { ...(r as object), ...setVals };
        out.push(store[k]);
      }
    }
    return out;
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
    then(onF: any, onR: any) {
      return exec().then(onF, onR);
    },
  };
  return b;
}

vi.mock("@workspace/db", () => {
  const db = {
    select: vi.fn((projection?: any) => buildSelect(projection ?? null)),
    insert: vi.fn((tbl: any) => buildInsert(tbl)),
    update: vi.fn((tbl: any) => buildUpdate(tbl)),
  };
  return {
    db,
    pool: {},
    usersTable: tables.users,
    accessTokensTable: tables.accessTokens,
    magicLinkTokensTable: tables.magicLinkTokens,
  };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: tables.users,
  accessTokensTable: tables.accessTokens,
  magicLinkTokensTable: tables.magicLinkTokens,
  insertUserSchema: passSchema,
}));

import accessTokensRouter from "../routes/access-tokens";
import authRouter from "../routes/auth";
import { authMiddleware } from "../middleware/auth";
import { csrfMiddleware, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../middleware/csrf";

const SESSION_COOKIE = "pgtsnd_session";

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfMiddleware);
  app.use("/api", authRouter);
  app.use("/api", authMiddleware);
  app.use("/api", accessTokensRouter);
  return app;
}

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

async function obtainCsrfToken(app: Express): Promise<string> {
  const res = await request(app).get("/api/auth/me");
  const token = readSetCookies(res.headers["set-cookie"])[CSRF_COOKIE_NAME];
  if (!token) throw new Error("expected CSRF cookie");
  return token;
}

function signSessionFor(userId: string, opts?: { tokenId?: string }): string {
  const u = state.users[userId];
  return jwt.sign(
    { userId: u.id, email: u.email, role: u.role, ...(opts?.tokenId ? { tokenId: opts.tokenId } : {}) },
    "test-jwt-secret",
    { expiresIn: "7d" },
  );
}

interface SendOpts {
  app: Express;
  method: "get" | "post" | "patch" | "delete";
  path: string;
  userId?: string;
  sessionTokenId?: string;
  body?: unknown;
  rawSession?: string;
}

async function send({ app, method, path, userId, sessionTokenId, body, rawSession }: SendOpts) {
  const csrf = await obtainCsrfToken(app);
  const cookieParts = [`${CSRF_COOKIE_NAME}=${csrf}`];
  if (rawSession !== undefined) {
    cookieParts.push(`${SESSION_COOKIE}=${rawSession}`);
  } else if (userId) {
    cookieParts.push(`${SESSION_COOKIE}=${signSessionFor(userId, { tokenId: sessionTokenId })}`);
  }
  let req = request(app)[method](path).set("Cookie", cookieParts.join("; "));
  if (method !== "get") req = req.set(CSRF_HEADER_NAME, csrf);
  return body !== undefined ? req.send(body) : req;
}

function hashAccessTokenLocal(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

let app: Express;

beforeAll(() => {
  app = buildApp();
});

beforeEach(() => {
  resetState();
});

describe("access tokens — creation", () => {
  it("owner can create an access token for an existing user", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-owner",
      body: { userId: "u-target", label: "Personal laptop" },
    });
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(10);
    expect(res.body.record).toMatchObject({
      userId: "u-target",
      label: "Personal laptop",
      status: "active",
      userEmail: "tokenuser@x.com",
      userRole: "client",
      createdBy: "u-owner",
    });
    // Token persisted as a hash, never plaintext
    const stored = Object.values(state.accessTokens)[0]!;
    expect(stored.tokenHash).toBe(hashAccessTokenLocal(res.body.token));
    expect(stored.tokenHash).not.toBe(res.body.token);
  });

  it("partner can also create an access token", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-partner",
      body: { userId: "u-target", label: "Partner-issued" },
    });
    expect(res.status).toBe(201);
  });

  it("crew cannot create an access token (403)", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-crew",
      body: { userId: "u-target", label: "Nope" },
    });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Insufficient permissions" });
    expect(Object.keys(state.accessTokens).length).toBe(0);
  });

  it("client cannot create an access token (403)", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-client",
      body: { userId: "u-target", label: "Nope" },
    });
    expect(res.status).toBe(403);
  });

  it("rejects creation without a label", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-owner",
      body: { userId: "u-target" },
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Label is required" });
  });

  it("rejects creation without userId or newUser", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens",
      userId: "u-owner",
      body: { label: "Whoops" },
    });
    expect(res.status).toBe(400);
  });
});

async function issueToken(opts: { userId: string; label?: string }): Promise<{
  plaintext: string;
  recordId: string;
}> {
  const res = await send({
    app,
    method: "post",
    path: "/api/access-tokens",
    userId: "u-owner",
    body: { userId: opts.userId, label: opts.label ?? "Test token" },
  });
  if (res.status !== 201) {
    throw new Error(`failed to issue token: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { plaintext: res.body.token, recordId: res.body.record.id };
}

describe("access tokens — login", () => {
  it("logs in with a valid token + matching email and sets a session cookie", async () => {
    const { plaintext, recordId } = await issueToken({ userId: "u-target" });

    const res = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=anything`)
      .set(CSRF_HEADER_NAME, "anything")
      .send({ email: "tokenuser@x.com", token: plaintext });

    // Note: this is an unauthenticated route mounted before authMiddleware,
    // and CSRF still applies — but we attach a matching token for the cookie.
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      user: {
        id: "u-target",
        email: "tokenuser@x.com",
        role: "client",
      },
      redirect: "/client-hub/dashboard",
    });

    const cookies = readSetCookies(res.headers["set-cookie"]);
    expect(cookies[SESSION_COOKIE]).toBeDefined();
    const decoded = jwt.verify(cookies[SESSION_COOKIE], "test-jwt-secret") as {
      userId: string;
      tokenId: string;
    };
    expect(decoded.userId).toBe("u-target");
    expect(decoded.tokenId).toBe(recordId);

    // lastUsedAt should be set
    expect(state.accessTokens[recordId].lastUsedAt).toBeInstanceOf(Date);
  });

  it("rejects login with an unknown token (401)", async () => {
    await issueToken({ userId: "u-target" });
    const res = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=x`)
      .set(CSRF_HEADER_NAME, "x")
      .send({ email: "tokenuser@x.com", token: "TOTALLY-WRONG-TOKEN" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid email or access token" });
  });

  it("rejects login with valid token but wrong email (401)", async () => {
    const { plaintext } = await issueToken({ userId: "u-target" });
    const res = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=x`)
      .set(CSRF_HEADER_NAME, "x")
      .send({ email: "someone-else@x.com", token: plaintext });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid email or access token" });
  });

  it("requires a token in the body (400)", async () => {
    const res = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=x`)
      .set(CSRF_HEADER_NAME, "x")
      .send({ email: "tokenuser@x.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Access token is required" });
  });
});

describe("access tokens — revocation", () => {
  it("owner can revoke a token", async () => {
    const { recordId } = await issueToken({ userId: "u-target" });
    const res = await send({
      app,
      method: "post",
      path: `/api/access-tokens/${recordId}/revoke`,
      userId: "u-owner",
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: recordId,
      status: "revoked",
      revokedBy: "u-owner",
    });
    expect(state.accessTokens[recordId].status).toBe("revoked");
  });

  it("crew cannot revoke a token (403)", async () => {
    const { recordId } = await issueToken({ userId: "u-target" });
    const res = await send({
      app,
      method: "post",
      path: `/api/access-tokens/${recordId}/revoke`,
      userId: "u-crew",
    });
    expect(res.status).toBe(403);
    expect(state.accessTokens[recordId].status).toBe("active");
  });

  it("client cannot revoke a token (403)", async () => {
    const { recordId } = await issueToken({ userId: "u-target" });
    const res = await send({
      app,
      method: "post",
      path: `/api/access-tokens/${recordId}/revoke`,
      userId: "u-client",
    });
    expect(res.status).toBe(403);
  });

  it("revoking an unknown token returns 404", async () => {
    const res = await send({
      app,
      method: "post",
      path: "/api/access-tokens/does-not-exist/revoke",
      userId: "u-owner",
    });
    expect(res.status).toBe(404);
  });

  it("after revoke, login with the same token is rejected (401)", async () => {
    const { plaintext, recordId } = await issueToken({ userId: "u-target" });

    // First confirm login works
    const ok = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=x`)
      .set(CSRF_HEADER_NAME, "x")
      .send({ email: "tokenuser@x.com", token: plaintext });
    expect(ok.status).toBe(200);

    // Owner revokes
    const revoke = await send({
      app,
      method: "post",
      path: `/api/access-tokens/${recordId}/revoke`,
      userId: "u-owner",
    });
    expect(revoke.status).toBe(200);

    // Login should now fail
    const res = await request(app)
      .post("/api/auth/access-token-login")
      .set("Cookie", `${CSRF_COOKIE_NAME}=x`)
      .set(CSRF_HEADER_NAME, "x")
      .send({ email: "tokenuser@x.com", token: plaintext });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid email or access token" });
  });

  it("after revoke, an existing session bound to the token is invalidated", async () => {
    const { recordId } = await issueToken({ userId: "u-target" });

    // Forge a session containing that tokenId (as access-token-login would mint)
    const session = signSessionFor("u-target", { tokenId: recordId });

    // /api/auth/me succeeds while token is active
    const okMe = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=${session}`);
    expect(okMe.status).toBe(200);
    expect(okMe.body.user.id).toBe("u-target");

    // /api/access-tokens (a protected route behind authMiddleware) requires
    // owner/partner role — the target user is a client and would get 403,
    // so probe with an owner session that ALSO carries a tokenId.
    const ownerWithToken = signSessionFor("u-owner", { tokenId: recordId });
    const okList = await request(app)
      .get("/api/access-tokens")
      .set("Cookie", `${SESSION_COOKIE}=${ownerWithToken}`);
    expect(okList.status).toBe(200);

    // Owner revokes the token
    const revoke = await send({
      app,
      method: "post",
      path: `/api/access-tokens/${recordId}/revoke`,
      userId: "u-owner",
    });
    expect(revoke.status).toBe(200);

    // Now the session bound to the revoked tokenId must be rejected by /auth/me
    const revokedMe = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=${session}`);
    expect(revokedMe.status).toBe(401);
    expect(revokedMe.body).toEqual({ error: "Access token revoked" });
    const cleared = readSetCookies(revokedMe.headers["set-cookie"]);
    expect(cleared[SESSION_COOKIE]).toBe("");

    // And it must be rejected by authMiddleware on a protected route
    const revokedProtected = await request(app)
      .get("/api/access-tokens")
      .set("Cookie", `${SESSION_COOKIE}=${ownerWithToken}`);
    expect(revokedProtected.status).toBe(401);
    expect(revokedProtected.body).toEqual({ error: "Access token revoked" });
  });
});
