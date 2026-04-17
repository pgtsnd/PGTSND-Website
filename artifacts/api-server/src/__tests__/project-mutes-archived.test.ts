import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Express } from "express";

interface MuteRow {
  userId: string;
  projectId: string;
}
interface ProjectRow {
  id: string;
  name: string;
  status: string;
  clientId: string | null;
}

const state: {
  projects: Record<string, ProjectRow>;
  mutes: MuteRow[];
} = { projects: {}, mutes: [] };

function resetState() {
  state.projects = {
    "p-active": {
      id: "p-active",
      name: "Active Project",
      status: "active",
      clientId: "u-client",
    },
    "p-archived": {
      id: "p-archived",
      name: "Archived Project",
      status: "archived",
      clientId: "u-client",
    },
  };
  state.mutes = [
    { userId: "u-client", projectId: "p-active" },
    { userId: "u-client", projectId: "p-archived" },
  ];
}
resetState();

const { tables } = vi.hoisted(() => {
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
      projectNotificationMutes: makeTable("projectNotificationMutes"),
    },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual =
    await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: (col: any, val: any) => ({ op: "eq", col, val }),
    and: (...args: any[]) => ({ op: "and", args }),
    or: (...args: any[]) => ({ op: "or", args }),
    inArray: (col: any, vals: any[]) => ({ op: "in", col, vals }),
  };
});

function flatEqs(cond: any): Array<[string, any]> {
  if (!cond) return [];
  if (cond.op === "and") return cond.args.flatMap(flatEqs);
  if (cond.op === "eq") return [[cond.col?.__col ?? "?", cond.val]];
  return [];
}

function buildSelectBuilder(_fields: Record<string, any> | null) {
  let primary: string | null = null;
  const conditions: any[] = [];
  const exec = async () => {
    if (primary === "projectNotificationMutes") {
      const eqs = flatEqs(conditions[0]);
      const userEq = eqs.find((e) => e[0] === "userId");
      const userId = userEq?.[1];
      const mutes = state.mutes.filter((m) => m.userId === userId);
      return mutes.map((m) => {
        const p = state.projects[m.projectId];
        return {
          projectId: m.projectId,
          name: p ? p.name : null,
          status: p ? p.status : null,
        };
      });
    }
    if (primary === "projects") {
      const eqs = flatEqs(conditions[0]);
      const idEq = eqs.find((e) => e[0] === "id");
      const p = idEq ? state.projects[idEq[1]] : null;
      if (!p) return [];
      return [{ clientId: p.clientId }];
    }
    if (primary === "projectMembers") {
      return [];
    }
    return [];
  };
  const b: any = {
    from(tbl: any) {
      primary = tbl?.__name ?? null;
      return b;
    },
    leftJoin() {
      return b;
    },
    where(cond: any) {
      conditions.push(cond);
      return b;
    },
    limit() {
      return b;
    },
    then(onF: any, onR: any) {
      return exec().then(onF, onR);
    },
  };
  return b;
}

vi.mock("@workspace/db", () => {
  const db = {
    select: vi.fn((fields?: Record<string, any>) =>
      buildSelectBuilder(fields ?? null),
    ),
    insert: vi.fn(() => ({
      values: () => ({ onConflictDoNothing: async () => undefined }),
    })),
    update: vi.fn(),
    delete: vi.fn(() => ({
      where: async () => undefined,
    })),
  };
  return {
    db,
    pool: {},
    usersTable: tables.users,
    projectsTable: tables.projects,
    projectMembersTable: tables.projectMembers,
    projectNotificationMutesTable: tables.projectNotificationMutes,
    phasesTable: {},
    deliverablesTable: {},
    tasksTable: {},
    taskItemsTable: {},
    reviewsTable: {},
    messagesTable: {},
    contractsTable: {},
    invoicesTable: {},
    videoCommentsTable: {},
  };
});

// Build a minimal express app that mounts only the project-mutes router
// (avoids loading the full app, which has unrelated import-time issues).
async function makeApp(userId: string): Promise<Express> {
  const { default: projectMutesRouter } = await import(
    "../routes/project-mutes"
  );
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { id: userId, email: "c@x.com", role: "client" };
    next();
  });
  app.use("/api", projectMutesRouter);
  return app;
}

beforeEach(() => {
  resetState();
});

describe("GET /api/users/me/project-mutes — archived projects keep their name", () => {
  it("returns the project name and 'archived' status for muted projects that have been archived", async () => {
    const app = await makeApp("u-client");
    const res = await request(app).get("/api/users/me/project-mutes");

    expect(res.status).toBe(200);
    expect(res.body.projectIds).toEqual(
      expect.arrayContaining(["p-active", "p-archived"]),
    );
    expect(res.body.mutes).toHaveLength(2);

    const archived = res.body.mutes.find(
      (m: { id: string }) => m.id === "p-archived",
    );
    expect(archived).toEqual({
      id: "p-archived",
      name: "Archived Project",
      status: "archived",
    });

    // The real project name flows through — never the "Unknown project"
    // fallback the client renders when name is missing.
    expect(archived.name).not.toBe("Unknown project");
    expect(archived.name).not.toBeNull();

    const active = res.body.mutes.find(
      (m: { id: string }) => m.id === "p-active",
    );
    expect(active).toEqual({
      id: "p-active",
      name: "Active Project",
      status: "active",
    });
  });

  it("still surfaces the name + status when the user no longer appears as the project's client", async () => {
    // Simulate the user losing direct project access (clientId reassigned)
    // while their mute row + the project row still exist. The endpoint must
    // keep returning the real name and status so the muted-projects list
    // can render it correctly instead of "Unknown project".
    state.projects["p-archived"].clientId = "someone-else";

    const app = await makeApp("u-client");
    const res = await request(app).get("/api/users/me/project-mutes");

    expect(res.status).toBe(200);
    const archived = res.body.mutes.find(
      (m: { id: string }) => m.id === "p-archived",
    );
    expect(archived).toEqual({
      id: "p-archived",
      name: "Archived Project",
      status: "archived",
    });
  });
});
