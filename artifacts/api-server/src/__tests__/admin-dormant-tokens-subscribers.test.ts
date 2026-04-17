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
  name: string;
  email: string;
  role: "owner" | "partner" | "crew" | "client";
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
}

const allUserRows: FakeUserRow[] = [];
// Captures the WHERE clause that the route applied so we can prove it
// filtered by role at the DB layer (not just in JS).
let lastWhere: { col?: string; val?: unknown } | null = null;

function resetUsers() {
  allUserRows.length = 0;
  lastWhere = null;
}

vi.mock("@workspace/db", () => {
  const usersTable = {
    __name: "users",
    id: "id",
    name: "name",
    email: "email",
    role: "role",
    emailNotifyDormantTokens: "emailNotifyDormantTokens",
    dormantTokensSnoozeUntil: "dormantTokensSnoozeUntil",
    dormantTokensUnsubscribedAt: "dormantTokensUnsubscribedAt",
  };

  const select = () => {
    const builder: any = {
      from: () => builder,
      where: (cond: { col?: string; val?: unknown }) => {
        lastWhere = cond ?? null;
        return builder;
      },
      orderBy: async () => {
        // Honor the route's role filter at the "DB" layer.
        const filtered = lastWhere?.col === "role"
          ? allUserRows.filter((r) => r.role === lastWhere?.val)
          : allUserRows.slice();
        return filtered
          .sort((a, b) => a.email.localeCompare(b.email))
          .map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            emailNotifyDormantTokens: r.emailNotifyDormantTokens,
            dormantTokensSnoozeUntil: r.dormantTokensSnoozeUntil,
            dormantTokensUnsubscribedAt: r.dormantTokensUnsubscribedAt,
          }));
      },
    };
    return builder;
  };

  return {
    db: { select, insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
    usersTable,
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
    eq: (col: unknown, val: unknown) => ({
      col: typeof col === "string" ? col : undefined,
      val,
    }),
    asc: (col: unknown) => col,
  };
});

import { requireRole } from "../middleware/auth";
import adminEmailSubscribersRouter from "../routes/admin-email-subscribers";

let currentRole: "owner" | "partner" | "crew" | "client" | null = "owner";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (currentRole) {
      (req as any).user = {
        id: "u1",
        email: "u1@x.com",
        name: "U",
        role: currentRole,
      };
    }
    next();
  });
  app.use("/api", adminEmailSubscribersRouter);
  return app;
}

describe("GET /api/admin/dormant-tokens-subscribers", () => {
  let app: Express;

  beforeEach(() => {
    resetUsers();
    app = buildApp();
    currentRole = "owner";
  });

  it("returns one row per owner with the correct status for each combination, and excludes non-owners", async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    allUserRows.push(
      {
        id: "o-sub",
        name: "Subscribed Owner",
        email: "a-sub@example.com",
        role: "owner",
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: null,
      },
      {
        id: "o-snooze",
        name: "Snoozed Owner",
        email: "b-snooze@example.com",
        role: "owner",
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: future,
        dormantTokensUnsubscribedAt: null,
      },
      {
        id: "o-stale-snooze",
        name: "Stale Snooze Owner",
        email: "c-stale@example.com",
        role: "owner",
        emailNotifyDormantTokens: true,
        // expired snooze in the past — should be reported as subscribed
        dormantTokensSnoozeUntil: past,
        dormantTokensUnsubscribedAt: null,
      },
      {
        id: "o-unsub",
        name: "Unsubscribed Owner",
        email: "d-unsub@example.com",
        role: "owner",
        emailNotifyDormantTokens: false,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: new Date("2025-04-01T12:00:00Z"),
      },
      // Non-owners must NOT show up in the audit, regardless of their
      // dormant-tokens email preferences.
      {
        id: "p-partner",
        name: "Partner Person",
        email: "partner@example.com",
        role: "partner",
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: null,
      },
      {
        id: "c-crew",
        name: "Crew Person",
        email: "crew@example.com",
        role: "crew",
        emailNotifyDormantTokens: false,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: new Date("2025-03-01T00:00:00Z"),
      },
      {
        id: "x-client",
        name: "Client Person",
        email: "client@example.com",
        role: "client",
        emailNotifyDormantTokens: true,
        dormantTokensSnoozeUntil: null,
        dormantTokensUnsubscribedAt: null,
      },
    );

    const res = await request(app)
      .get("/api/admin/dormant-tokens-subscribers")
      .expect(200);

    // The route must filter by role at the DB layer.
    expect(lastWhere?.col).toBe("role");
    expect(lastWhere?.val).toBe("owner");

    expect(Array.isArray(res.body.owners)).toBe(true);
    const ids = (res.body.owners as Array<{ id: string }>).map((o) => o.id);
    expect(ids).toEqual(
      expect.arrayContaining(["o-sub", "o-snooze", "o-stale-snooze", "o-unsub"]),
    );
    expect(ids).not.toContain("p-partner");
    expect(ids).not.toContain("c-crew");
    expect(ids).not.toContain("x-client");
    expect(res.body.owners).toHaveLength(4);

    const byId: Record<string, any> = Object.fromEntries(
      res.body.owners.map((o: any) => [o.id, o]),
    );

    expect(byId["o-sub"].status).toBe("subscribed");
    expect(byId["o-sub"].snoozeUntil).toBeNull();
    expect(byId["o-sub"].unsubscribedAt).toBeNull();

    expect(byId["o-snooze"].status).toBe("snoozed");
    expect(byId["o-snooze"].snoozeUntil).toBe(future.toISOString());

    // Snooze that has already elapsed — not snoozed anymore.
    expect(byId["o-stale-snooze"].status).toBe("subscribed");

    expect(byId["o-unsub"].status).toBe("unsubscribed");
    expect(byId["o-unsub"].unsubscribedAt).toBe(
      "2025-04-01T12:00:00.000Z",
    );
    expect(byId["o-unsub"].emailNotifyDormantTokens).toBe(false);
  });

  it("returns an empty array when there are no owners (even if other roles exist)", async () => {
    allUserRows.push({
      id: "p1",
      name: "Solo Partner",
      email: "p@x.com",
      role: "partner",
      emailNotifyDormantTokens: true,
      dormantTokensSnoozeUntil: null,
      dormantTokensUnsubscribedAt: null,
    });
    const res = await request(app)
      .get("/api/admin/dormant-tokens-subscribers")
      .expect(200);
    expect(res.body).toEqual({ owners: [] });
  });

  it("returns an empty array when there are no users at all", async () => {
    const res = await request(app)
      .get("/api/admin/dormant-tokens-subscribers")
      .expect(200);
    expect(res.body).toEqual({ owners: [] });
  });

  it("rejects non-owner callers with 403 'Insufficient permissions'", async () => {
    for (const role of ["partner", "crew", "client"] as const) {
      currentRole = role;
      const res = await request(app)
        .get("/api/admin/dormant-tokens-subscribers")
        .expect(403);
      expect(res.body).toEqual({ error: "Insufficient permissions" });
    }
  });

  it("rejects unauthenticated callers with 401", async () => {
    currentRole = null;
    const res = await request(app)
      .get("/api/admin/dormant-tokens-subscribers")
      .expect(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("uses the real requireRole middleware (sanity)", () => {
    expect(typeof requireRole).toBe("function");
  });
});
