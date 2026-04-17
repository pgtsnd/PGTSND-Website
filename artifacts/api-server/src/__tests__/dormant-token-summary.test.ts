import { describe, it, expect, beforeEach, vi } from "vitest";

interface FakeAccessTokenRow {
  id: string;
  userId: string;
  label: string;
  status: "active" | "revoked";
  createdAt: Date;
  lastUsedAt: Date | null;
}
interface FakeUserRow {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "partner" | "crew" | "client";
}

const accessTokenRows: FakeAccessTokenRow[] = [];
const userRows: FakeUserRow[] = [];
const summaryRunRows: { id: string; sentAt: Date; recipientCount: number; tokenCount: number }[] = [];

function resetData() {
  accessTokenRows.length = 0;
  userRows.length = 0;
  summaryRunRows.length = 0;
}

const sendEmailMock = vi.fn(async () => ({ ok: true as const }));

vi.mock("../services/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...(args as [])),
  getAppBaseUrl: () => "https://app.example.com",
}));

vi.mock("@workspace/db", () => {
  const accessTokensTable = {
    __name: "access_tokens",
    id: "id",
    userId: "userId",
    label: "label",
    status: "status",
    createdAt: "createdAt",
    lastUsedAt: "lastUsedAt",
  };
  const usersTable = {
    __name: "users",
    id: "id",
    email: "email",
    name: "name",
    role: "role",
  };
  const dormantTokenSummaryRunsTable = {
    __name: "dormant_token_summary_runs",
    id: "id",
    sentAt: "sentAt",
  };

  function selectAccessTokensJoinUsers() {
    return accessTokenRows.map((t) => {
      const u = userRows.find((u) => u.id === t.userId)!;
      return {
        id: t.id,
        label: t.label,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
        userName: u?.name ?? null,
        userEmail: u?.email ?? "missing@example.com",
        __status: t.status,
      };
    });
  }

  return {
    db: {
      select: (cols: Record<string, unknown>) => {
        const colKeys = Object.keys(cols ?? {});
        const isSummaryQuery = colKeys.includes("sentAt") && colKeys.length === 1;
        const isOwnersQuery =
          colKeys.includes("email") &&
          colKeys.includes("name") &&
          !colKeys.includes("userEmail");
        return {
          from: (table: { __name: string }) => {
            if (table.__name === "dormant_token_summary_runs") {
              return {
                orderBy: () => ({
                  limit: async () => {
                    if (summaryRunRows.length === 0) return [];
                    const sorted = [...summaryRunRows].sort(
                      (a, b) => b.sentAt.getTime() - a.sentAt.getTime(),
                    );
                    return [{ sentAt: sorted[0].sentAt }];
                  },
                }),
              };
            }
            if (table.__name === "users" && isOwnersQuery) {
              return {
                where: async () =>
                  userRows
                    .filter((u) => u.role === "owner")
                    .map((u) => ({ email: u.email, name: u.name })),
              };
            }
            // access tokens join users
            return {
              innerJoin: () => ({
                where: async () =>
                  selectAccessTokensJoinUsers().filter(
                    (r) => r.__status === "active",
                  ),
              }),
            };
          },
          // Used by old code paths (none here)
          where: async () => [],
        };
      },
      insert: (table: { __name: string }) => ({
        values: async (vals: { sentAt?: Date; recipientCount?: number; tokenCount?: number }) => {
          if (table.__name === "dormant_token_summary_runs") {
            summaryRunRows.push({
              id: `run-${summaryRunRows.length + 1}`,
              sentAt: vals.sentAt ?? new Date(),
              recipientCount: vals.recipientCount ?? 0,
              tokenCount: vals.tokenCount ?? 0,
            });
          }
        },
      }),
    },
    accessTokensTable,
    usersTable,
    dormantTokenSummaryRunsTable,
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: (_a: unknown, b: unknown) => ({ __op: "eq", b }),
    desc: (a: unknown) => ({ __op: "desc", a }),
  };
});

import {
  runDormantTokenSummary,
  findDormantAccessTokens,
  DORMANT_THRESHOLD_DAYS,
} from "../jobs/dormant-token-summary";

const NOW = new Date("2026-04-17T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function addToken(partial: Partial<FakeAccessTokenRow> & { userId: string }) {
  const t: FakeAccessTokenRow = {
    id: `tk-${accessTokenRows.length + 1}`,
    label: "Token",
    status: "active",
    createdAt: new Date(NOW.getTime() - 365 * DAY),
    lastUsedAt: null,
    ...partial,
  };
  accessTokenRows.push(t);
  return t;
}
function addUser(u: FakeUserRow) {
  userRows.push(u);
  return u;
}

describe("dormant token summary job", () => {
  beforeEach(() => {
    resetData();
    sendEmailMock.mockClear();
    sendEmailMock.mockImplementation(async () => ({ ok: true as const }));
  });

  it("flags tokens whose last activity is older than the threshold", async () => {
    addUser({ id: "u1", email: "u1@x.com", name: "User One", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale",
      lastUsedAt: new Date(NOW.getTime() - (DORMANT_THRESHOLD_DAYS + 5) * DAY),
    });
    addToken({
      userId: "u1",
      label: "Recent",
      lastUsedAt: new Date(NOW.getTime() - 10 * DAY),
    });

    const dormant = await findDormantAccessTokens(NOW);
    expect(dormant.map((d) => d.label)).toEqual(["Stale"]);
  });

  it("uses createdAt when token was never used", async () => {
    addUser({ id: "u1", email: "u1@x.com", name: "User", role: "crew" });
    addToken({
      userId: "u1",
      label: "NeverUsedOld",
      lastUsedAt: null,
      createdAt: new Date(NOW.getTime() - (DORMANT_THRESHOLD_DAYS + 1) * DAY),
    });
    addToken({
      userId: "u1",
      label: "NeverUsedFresh",
      lastUsedAt: null,
      createdAt: new Date(NOW.getTime() - 5 * DAY),
    });

    const dormant = await findDormantAccessTokens(NOW);
    expect(dormant.map((d) => d.label)).toEqual(["NeverUsedOld"]);
    expect(dormant[0].lastActivityLabel).toMatch(/Never used/);
  });

  it("ignores revoked tokens", async () => {
    addUser({ id: "u1", email: "u1@x.com", name: "User", role: "crew" });
    addToken({
      userId: "u1",
      label: "OldRevoked",
      status: "revoked",
      lastUsedAt: new Date(NOW.getTime() - 365 * DAY),
    });
    const dormant = await findDormantAccessTokens(NOW);
    expect(dormant).toHaveLength(0);
  });

  it("does not send when there are no dormant tokens", async () => {
    addUser({ id: "owner1", email: "owner@x.com", name: "Own", role: "owner" });
    addUser({ id: "u1", email: "u1@x.com", name: "U", role: "crew" });
    addToken({
      userId: "u1",
      label: "Fresh",
      lastUsedAt: new Date(NOW.getTime() - 1 * DAY),
    });

    const result = await runDormantTokenSummary(NOW);
    expect(result.ran).toBe(false);
    expect(result.reason).toBe("no-dormant");
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(summaryRunRows).toHaveLength(0);
  });

  it("emails every owner and records the run when dormant tokens exist", async () => {
    addUser({ id: "o1", email: "owner1@x.com", name: "Owner One", role: "owner" });
    addUser({ id: "o2", email: "owner2@x.com", name: "Owner Two", role: "owner" });
    addUser({ id: "p1", email: "partner@x.com", name: "Partner", role: "partner" });
    addUser({ id: "u1", email: "user@x.com", name: "User", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale CI",
      lastUsedAt: new Date(NOW.getTime() - (DORMANT_THRESHOLD_DAYS + 30) * DAY),
    });

    const result = await runDormantTokenSummary(NOW);
    expect(result.ran).toBe(true);
    expect(result.recipientCount).toBe(2);
    expect(result.tokenCount).toBe(1);

    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    const recipients = sendEmailMock.mock.calls.map((c: any) => c[0].to);
    expect(recipients.sort()).toEqual(["owner1@x.com", "owner2@x.com"]);

    const firstCall = sendEmailMock.mock.calls[0][0] as any;
    expect(firstCall.subject).toMatch(/Weekly access-token review/);
    expect(firstCall.subject).toMatch(/1 dormant token/);
    expect(firstCall.text).toContain("Stale CI");
    expect(firstCall.text).toContain("https://app.example.com/team/access");
    expect(firstCall.html).toContain("Stale CI");
    expect(firstCall.html).toContain("Review Access Tokens");

    expect(summaryRunRows).toHaveLength(1);
    expect(summaryRunRows[0].recipientCount).toBe(2);
    expect(summaryRunRows[0].tokenCount).toBe(1);
  });

  it("does not re-send within a week of the last run", async () => {
    addUser({ id: "o1", email: "owner@x.com", name: "Owner", role: "owner" });
    addUser({ id: "u1", email: "user@x.com", name: "U", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale",
      lastUsedAt: new Date(NOW.getTime() - 200 * DAY),
    });

    const first = await runDormantTokenSummary(NOW);
    expect(first.ran).toBe(true);
    sendEmailMock.mockClear();

    const threeDaysLater = new Date(NOW.getTime() + 3 * DAY);
    const second = await runDormantTokenSummary(threeDaysLater);
    expect(second.ran).toBe(false);
    expect(second.reason).toBe("too-soon");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("re-sends after a full week has elapsed", async () => {
    addUser({ id: "o1", email: "owner@x.com", name: "Owner", role: "owner" });
    addUser({ id: "u1", email: "user@x.com", name: "U", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale",
      lastUsedAt: new Date(NOW.getTime() - 200 * DAY),
    });

    await runDormantTokenSummary(NOW);
    sendEmailMock.mockClear();

    const eightDaysLater = new Date(NOW.getTime() + 8 * DAY);
    const result = await runDormantTokenSummary(eightDaysLater);
    expect(result.ran).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(summaryRunRows).toHaveLength(2);
  });

  it("does not record a run when every email send fails (so it retries soon)", async () => {
    addUser({ id: "o1", email: "owner@x.com", name: "Owner", role: "owner" });
    addUser({ id: "u1", email: "user@x.com", name: "U", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale",
      lastUsedAt: new Date(NOW.getTime() - 200 * DAY),
    });

    sendEmailMock.mockImplementation(async () => ({
      ok: false as const,
      error: "smtp boom",
    }));

    const result = await runDormantTokenSummary(NOW);
    expect(result.ran).toBe(false);
    expect(summaryRunRows).toHaveLength(0);

    sendEmailMock.mockImplementation(async () => ({ ok: true as const }));
    const retry = await runDormantTokenSummary(
      new Date(NOW.getTime() + 60 * 60 * 1000),
    );
    expect(retry.ran).toBe(true);
    expect(summaryRunRows).toHaveLength(1);
  });

  it("sorts dormant tokens by oldest activity first (not by formatted label)", async () => {
    addUser({ id: "u1", email: "u@x.com", name: "U", role: "crew" });
    // Three tokens at different ages; pick labels that would sort
    // "wrong" alphabetically vs. by date.
    addToken({
      userId: "u1",
      label: "Z-newest-stale",
      lastUsedAt: new Date(NOW.getTime() - 100 * DAY),
    });
    addToken({
      userId: "u1",
      label: "A-oldest",
      lastUsedAt: new Date(NOW.getTime() - 400 * DAY),
    });
    addToken({
      userId: "u1",
      label: "M-middle",
      lastUsedAt: new Date(NOW.getTime() - 200 * DAY),
    });

    const dormant = await findDormantAccessTokens(NOW);
    expect(dormant.map((d) => d.label)).toEqual([
      "A-oldest",
      "M-middle",
      "Z-newest-stale",
    ]);
  });

  it("does nothing if there are no owner recipients", async () => {
    addUser({ id: "p1", email: "p@x.com", name: "P", role: "partner" });
    addUser({ id: "u1", email: "u@x.com", name: "U", role: "crew" });
    addToken({
      userId: "u1",
      label: "Stale",
      lastUsedAt: new Date(NOW.getTime() - 200 * DAY),
    });

    const result = await runDormantTokenSummary(NOW);
    expect(result.ran).toBe(false);
    expect(result.reason).toBe("no-recipients");
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(summaryRunRows).toHaveLength(0);
  });
});
