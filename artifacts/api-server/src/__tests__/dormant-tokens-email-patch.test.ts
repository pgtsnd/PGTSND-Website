import { describe, it, expect, beforeEach, vi } from "vitest";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import request from "supertest";

interface FakeUserRow {
  id: string;
  email: string;
  name: string;
  role: "owner" | "partner" | "crew" | "client";
  emailNotifyReviews: boolean;
  emailNotifyComments: boolean;
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
  bookkeeperEmail: string | null;
  initials: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  title: string | null;
  createdAt: Date;
}

const userRows: FakeUserRow[] = [];

function freshUser(overrides: Partial<FakeUserRow> = {}): FakeUserRow {
  return {
    id: "u-owner",
    email: "owner@example.com",
    name: "Owner",
    role: "owner",
    emailNotifyReviews: true,
    emailNotifyComments: true,
    emailNotifyDormantTokens: true,
    dormantTokensSnoozeUntil: null,
    dormantTokensUnsubscribedAt: null,
    bookkeeperEmail: null,
    initials: "OW",
    avatarUrl: null,
    googleId: null,
    title: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

vi.mock("@workspace/db", () => {
  const usersTable = { __name: "users" };
  const passSchema = {
    safeParse: (data: unknown) => ({ success: true as const, data }),
  };

  const update = (_tbl: any) => {
    let setVals: Partial<FakeUserRow> = {};
    let targetId: string | null = null;
    const builder: any = {
      set(v: Partial<FakeUserRow>) {
        setVals = v;
        return builder;
      },
      where(c: { __targetId?: string }) {
        if (c && typeof c.__targetId === "string") targetId = c.__targetId;
        return builder;
      },
      async returning() {
        const idx = userRows.findIndex((u) => u.id === targetId);
        if (idx === -1) return [];
        userRows[idx] = { ...userRows[idx], ...setVals };
        return [userRows[idx]];
      },
    };
    return builder;
  };

  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => userRows.slice(0, 1),
            orderBy: async () => [],
          }),
        }),
      }),
      insert: vi.fn(),
      update,
      delete: vi.fn(),
    },
    usersTable,
    distributionListsTable: {},
    insertUserSchema: passSchema,
    updateUserSchema: passSchema,
    selectUserSchema: passSchema,
    selectDistributionListSchema: passSchema,
    insertDistributionListBodySchema: passSchema,
    patchDistributionListBodySchema: passSchema,
    magicLinkTokensTable: {},
    pool: {},
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm",
  );
  return {
    ...actual,
    eq: (_col: unknown, val: unknown) => ({ __targetId: val }),
    and: (...args: unknown[]) => ({ __and: args }),
    asc: (col: unknown) => col,
  };
});

import usersRouter from "../routes/users";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      id: "u-owner",
      email: "owner@example.com",
      name: "Owner",
      role: "owner",
    };
    next();
  });
  app.use("/api", usersRouter);
  return app;
}

describe("PATCH /api/users/me/dormant-tokens-email — unsubscribed_at audit field", () => {
  let app: Express;

  beforeEach(() => {
    userRows.length = 0;
    userRows.push(freshUser());
    app = buildApp();
  });

  it("sets dormantTokensUnsubscribedAt to a fresh timestamp when the user opts out", async () => {
    const before = Date.now();
    const res = await request(app)
      .patch("/api/users/me/dormant-tokens-email")
      .send({ emailNotifyDormantTokens: false })
      .expect(200);

    expect(res.body.emailNotifyDormantTokens).toBe(false);
    const stamp = res.body.dormantTokensUnsubscribedAt as string;
    expect(typeof stamp).toBe("string");
    const stampMs = new Date(stamp).getTime();
    expect(Number.isFinite(stampMs)).toBe(true);
    expect(stampMs).toBeGreaterThanOrEqual(before - 1000);
    expect(stampMs).toBeLessThanOrEqual(Date.now() + 1000);

    const stored = userRows[0];
    expect(stored.emailNotifyDormantTokens).toBe(false);
    expect(stored.dormantTokensUnsubscribedAt).toBeInstanceOf(Date);
  });

  it("does NOT touch dormantTokensUnsubscribedAt when the user resubscribes", async () => {
    // Start as already-unsubscribed with a known historical timestamp.
    const historical = new Date("2025-02-01T12:00:00Z");
    userRows[0] = freshUser({
      emailNotifyDormantTokens: false,
      dormantTokensUnsubscribedAt: historical,
    });

    const res = await request(app)
      .patch("/api/users/me/dormant-tokens-email")
      .send({ emailNotifyDormantTokens: true })
      .expect(200);

    expect(res.body.emailNotifyDormantTokens).toBe(true);
    // The historical opt-out timestamp must be preserved for audit.
    expect(userRows[0].dormantTokensUnsubscribedAt?.toISOString()).toBe(
      historical.toISOString(),
    );
  });

  it("does NOT touch dormantTokensUnsubscribedAt when only the snooze is changed", async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await request(app)
      .patch("/api/users/me/dormant-tokens-email")
      .send({ snoozeUntil: future })
      .expect(200);

    expect(userRows[0].dormantTokensUnsubscribedAt).toBeNull();
    expect(userRows[0].dormantTokensSnoozeUntil).toBeInstanceOf(Date);
  });
});
