import { describe, it, expect, beforeEach, vi } from "vitest";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import {
  csrfMiddleware,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "../middleware/csrf";

type Owner = {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "partner" | "crew" | "client";
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
};

let owners: Owner[] = [];
let currentRole: "owner" | "partner" | "crew" | "client" | "anon" = "owner";

vi.mock("@workspace/db", () => {
  const usersTable = {
    id: "id",
    name: "name",
    email: "email",
    role: "role",
    emailNotifyDormantTokens: "emailNotifyDormantTokens",
    dormantTokensSnoozeUntil: "dormantTokensSnoozeUntil",
    dormantTokensUnsubscribedAt: "dormantTokensUnsubscribedAt",
  };

  type UpdateState = {
    set?: Partial<Owner>;
    targetId?: string;
  };

  const db = {
    select: (_cols?: any) => ({
      from: (_t: any) => {
        const chain = {
          where: (_w: any) => chain,
          orderBy: (_o: any) => Promise.resolve(owners),
          limit: (_n: number) => {
            const id = (chain as any)._whereId as string | undefined;
            const found = owners.find((o) => o.id === id && o.role === "owner");
            return Promise.resolve(found ? [found] : []);
          },
        } as any;
        const origWhere = chain.where;
        chain.where = (cond: any) => {
          if (cond && typeof cond === "object" && "id" in cond) {
            (chain as any)._whereId = cond.id;
          }
          return origWhere(cond);
        };
        return chain;
      },
    }),
    update: (_t: any) => ({
      set: (values: Partial<Owner>) => {
        const state: UpdateState = { set: values };
        return {
          where: (cond: { id?: string }) => {
            state.targetId = cond.id;
            return {
              returning: (_cols?: any) => {
                const idx = owners.findIndex((o) => o.id === state.targetId);
                if (idx === -1) return Promise.resolve([]);
                owners[idx] = { ...owners[idx], ...state.set! };
                return Promise.resolve([
                  { id: owners[idx].id, email: owners[idx].email },
                ]);
              },
            };
          },
        };
      },
    }),
  };

  return { db, usersTable };
});

vi.mock("drizzle-orm", () => ({
  asc: (_c: any) => ({}),
  eq: (col: any, val: any) => ({ [String(col)]: val }),
  and: (...args: any[]) => Object.assign({}, ...args),
}));

vi.mock("../middleware/auth", () => ({
  requireRole:
    (...allowed: Array<"owner" | "partner" | "crew" | "client">) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (currentRole === "anon") {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!allowed.includes(currentRole as any)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      (req as any).user = {
        id: "admin-1",
        role: currentRole,
        email: "admin@pgtsnd.com",
        name: "Admin",
      };
      next();
    },
}));

vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import adminEmailSubscribersRouter from "../routes/admin-email-subscribers";
import { logger } from "../lib/logger";

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfMiddleware);
  app.use("/api", adminEmailSubscribersRouter);
  return app;
}

function parseCsrfCookie(
  setCookieHeader: string[] | string | undefined,
): { raw: string; token: string } | null {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const csrf = cookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!csrf) return null;
  const value = csrf.split(";")[0];
  const token = value.substring(CSRF_COOKIE_NAME.length + 1);
  return { raw: value, token };
}

async function csrfHandshake(app: Express) {
  const get = await request(app).get(
    "/api/admin/dormant-tokens-subscribers",
  );
  const parsed = parseCsrfCookie(get.headers["set-cookie"]);
  if (!parsed) throw new Error("No CSRF cookie issued by handshake");
  return parsed;
}

describe("POST /api/admin/dormant-tokens-subscribers/:id/resubscribe", () => {
  let app: Express;

  beforeEach(() => {
    currentRole = "owner";
    vi.mocked(logger.info).mockClear();
    owners = [
      {
        id: "owner-unsub",
        email: "unsub@pgtsnd.com",
        name: "Una Subscribed",
        role: "owner",
        emailNotifyDormantTokens: false,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        id: "owner-sub",
        email: "sub@pgtsnd.com",
        name: "Sue Scribed",
        role: "owner",
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: null,
      },
      {
        id: "partner-1",
        email: "partner@pgtsnd.com",
        name: "Pat Partner",
        role: "partner",
        emailNotifyDormantTokens: false,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    app = buildApp();
  });

  it("re-subscribes an unsubscribed owner and clears unsubscribe stamp", async () => {
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-unsub/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, id: "owner-unsub" });
    const updated = owners.find((o) => o.id === "owner-unsub")!;
    expect(updated.emailNotifyDormantTokens).toBe(true);
    expect(updated.dormantTokensUnsubscribedAt).toBeNull();
    expect(updated.dormantTokensSnoozeUntil).toBeNull();
  });

  it("audit-logs the action with actor and target", async () => {
    const csrf = await csrfHandshake(app);
    await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-unsub/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(logger.info).toHaveBeenCalledTimes(1);
    const call = vi.mocked(logger.info).mock.calls[0];
    expect(call[0]).toMatchObject({
      actorId: "admin-1",
      actorEmail: "admin@pgtsnd.com",
      targetUserId: "owner-unsub",
      targetEmail: "unsub@pgtsnd.com",
      action: "dormant-tokens.resubscribe",
    });
  });

  it("rejects POST without a CSRF header (403) — front-end must send the token", async () => {
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-unsub/resubscribe")
      .set("Cookie", csrf.raw);
    expect(res.status).toBe(403);
    const owner = owners.find((o) => o.id === "owner-unsub")!;
    expect(owner.emailNotifyDormantTokens).toBe(false);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("returns 409 when the owner is already subscribed", async () => {
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-sub/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(res.status).toBe(409);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown id", async () => {
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/missing/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(res.status).toBe(404);
  });

  it("returns 404 when target user is not an owner", async () => {
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/partner-1/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(res.status).toBe(404);
    const partner = owners.find((o) => o.id === "partner-1")!;
    expect(partner.emailNotifyDormantTokens).toBe(false);
  });

  it("rejects non-owner callers (403)", async () => {
    currentRole = "partner";
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-unsub/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated callers (401)", async () => {
    currentRole = "anon";
    const csrf = await csrfHandshake(app);
    const res = await request(app)
      .post("/api/admin/dormant-tokens-subscribers/owner-unsub/resubscribe")
      .set("Cookie", csrf.raw)
      .set(CSRF_HEADER_NAME, csrf.token);
    expect(res.status).toBe(401);
  });
});
