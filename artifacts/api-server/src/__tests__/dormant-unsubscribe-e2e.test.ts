import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";

// ---------------------------------------------------------------------------
// End-to-end test for the 90-day unsubscribe link expiry.
//
// This test exercises the complete loop:
//   1. The dormant-token summary job generates a real email containing a real
//      one-click unsubscribe link.
//   2. We extract that link from the email body.
//   3. We fast-forward time past the 90-day TTL.
//   4. We follow the link through the actual Express app and assert that the
//      user lands on the new "Invalid or expired link" page (with the expiry
//      copy and the Notifications settings link), and that the user's
//      notification preferences were NOT changed.
//
// The companion happy-path test confirms that following the same link before
// the TTL expires lands on "You're unsubscribed" with the issued-on date.
// ---------------------------------------------------------------------------

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
  emailNotifyDormantTokens: boolean;
  dormantTokensSnoozeUntil: Date | null;
  dormantTokensUnsubscribedAt: Date | null;
}

const accessTokenRows: FakeAccessTokenRow[] = [];
const userRows: FakeUserRow[] = [];
const summaryRunRows: {
  id: string;
  sentAt: Date;
  recipientCount: number;
  tokenCount: number;
}[] = [];

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

vi.mock("../services/studio-settings", () => ({
  getDormantTokenThresholdDays: async () => 90,
  getOrCreateStudioSettings: async () => ({
    dormantTokenThresholdDays: 90,
  }),
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
    emailNotifyDormantTokens: "emailNotifyDormantTokens",
    dormantTokensSnoozeUntil: "dormantTokensSnoozeUntil",
    dormantTokensUnsubscribedAt: "dormantTokensUnsubscribedAt",
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

  function makeUpdate() {
    return (_table: { __name: string }) => ({
      set: (vals: Partial<FakeUserRow>) => ({
        where: (cond: { __targetId: string }) => {
          const apply = () => {
            const idx = userRows.findIndex((u) => u.id === cond.__targetId);
            if (idx === -1) return [];
            userRows[idx] = { ...userRows[idx], ...vals };
            return [userRows[idx]];
          };
          return {
            returning: async (_cols?: Record<string, unknown>) => {
              const rows = apply();
              return rows.map((r) => ({ email: r.email }));
            },
            then: (
              resolve: (v: unknown) => unknown,
              reject?: (e: unknown) => unknown,
            ) => {
              try {
                apply();
                return Promise.resolve(undefined).then(resolve, reject);
              } catch (e) {
                return Promise.reject(e).then(resolve, reject);
              }
            },
          };
        },
      }),
    });
  }

  return {
    db: {
      select: (cols: Record<string, unknown>) => {
        const colKeys = Object.keys(cols ?? {});
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
                    .map((u) => ({
                      id: u.id,
                      email: u.email,
                      name: u.name,
                      emailNotifyDormantTokens: u.emailNotifyDormantTokens,
                      dormantTokensSnoozeUntil: u.dormantTokensSnoozeUntil,
                    })),
              };
            }
            return {
              innerJoin: () => ({
                where: async () =>
                  selectAccessTokensJoinUsers().filter(
                    (r) => r.__status === "active",
                  ),
              }),
            };
          },
          where: async () => [],
        };
      },
      insert: (table: { __name: string }) => ({
        values: async (vals: {
          sentAt?: Date;
          recipientCount?: number;
          tokenCount?: number;
        }) => {
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
      update: makeUpdate(),
    },
    accessTokensTable,
    usersTable,
    dormantTokenSummaryRunsTable,
    magicLinkTokensTable: {},
    pool: {},
  };
});

vi.mock("@workspace/db/schema", () => ({
  usersTable: {},
  magicLinkTokensTable: {},
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm",
  );
  return {
    ...actual,
    eq: (_col: unknown, val: unknown) => ({ __targetId: val, __op: "eq" }),
    desc: (a: unknown) => ({ __op: "desc", a }),
  };
});

import appModule from "../app";
import { runDormantTokenSummary } from "../jobs/dormant-token-summary";

const DAY_MS = 24 * 60 * 60 * 1000;

function findUser(id: string): FakeUserRow | undefined {
  return userRows.find((u) => u.id === id);
}

/**
 * Pulls the unsubscribe URL out of the most-recently-sent email and returns
 * the path+query the way Express will see it (without the absolute origin).
 */
function extractUnsubscribePath(): string {
  expect(sendEmailMock).toHaveBeenCalled();
  const lastCall = sendEmailMock.mock.calls.at(-1)![0] as {
    text: string;
    html?: string;
  };
  const match = lastCall.text.match(
    /https:\/\/app\.example\.com(\/api\/unsubscribe\/dormant-tokens\?token=[^\s]+)/,
  );
  expect(match, "unsubscribe URL not found in email body").toBeTruthy();
  return match![1];
}

describe("dormant-tokens unsubscribe link 90-day expiry (end-to-end)", () => {
  beforeEach(() => {
    resetData();
    sendEmailMock.mockClear();
    sendEmailMock.mockImplementation(async () => ({ ok: true as const }));

    // Owner who will receive the dormant-tokens email.
    userRows.push({
      id: "owner-1",
      email: "owner@example.com",
      name: "Owner One",
      role: "owner",
      emailNotifyDormantTokens: true,
      dormantTokensSnoozeUntil: null,
      dormantTokensUnsubscribedAt: null,
    });
    // A teammate whose access token is dormant — gives the job something to
    // report on so it actually generates an email.
    userRows.push({
      id: "crew-1",
      email: "crew@example.com",
      name: "Crew One",
      role: "crew",
      emailNotifyDormantTokens: true,
      dormantTokensSnoozeUntil: null,
      dormantTokensUnsubscribedAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("a real link followed AFTER the 90-day TTL renders the expiry page and does not opt the user out", async () => {
    // Anchor "now" so issuance and expiry are deterministic.
    const issuanceTime = new Date("2026-02-01T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(issuanceTime);

    accessTokenRows.push({
      id: "tk-1",
      userId: "crew-1",
      label: "Stale CI token",
      status: "active",
      createdAt: new Date(issuanceTime.getTime() - 365 * DAY_MS),
      lastUsedAt: new Date(issuanceTime.getTime() - 200 * DAY_MS),
    });

    // 1) Generate a real email with a real unsubscribe link.
    const result = await runDormantTokenSummary(issuanceTime);
    expect(result.ran).toBe(true);
    expect(result.recipientCount).toBe(1);

    const unsubscribePath = extractUnsubscribePath();

    // 2) Fast-forward past the 90-day TTL. The route reads Date.now() inside
    //    verifyUnsubscribeToken, so moving the system clock is sufficient.
    vi.setSystemTime(new Date(issuanceTime.getTime() + 91 * DAY_MS));

    // 3) Follow the link.
    const res = await request(appModule).get(unsubscribePath).expect(400);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("Invalid or expired link");
    // The page must explain the 90-day expiry policy in human-friendly copy
    // and point the user at their notification preferences.
    expect(res.text).toContain("90 days");
    expect(res.text).toContain("/team/settings?section=notifications");
    expect(res.text).toContain("Notifications settings");

    // 4) The user's notification preferences must be untouched.
    const owner = findUser("owner-1")!;
    expect(owner.emailNotifyDormantTokens).toBe(true);
    expect(owner.dormantTokensUnsubscribedAt).toBeNull();
  });

  it("a real link followed BEFORE the TTL lands on the You're-unsubscribed page with the issued-on date", async () => {
    const issuanceTime = new Date("2026-02-10T08:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(issuanceTime);

    accessTokenRows.push({
      id: "tk-1",
      userId: "crew-1",
      label: "Stale CI token",
      status: "active",
      createdAt: new Date(issuanceTime.getTime() - 365 * DAY_MS),
      lastUsedAt: new Date(issuanceTime.getTime() - 200 * DAY_MS),
    });

    const result = await runDormantTokenSummary(issuanceTime);
    expect(result.ran).toBe(true);

    const unsubscribePath = extractUnsubscribePath();

    // Follow the link a few minutes later — well within the TTL.
    vi.setSystemTime(new Date(issuanceTime.getTime() + 5 * 60 * 1000));

    const res = await request(appModule).get(unsubscribePath).expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("You're unsubscribed");
    expect(res.text).toContain("owner@example.com");
    expect(res.text).toContain("dormant access-token summary");
    // The confirmation page surfaces when the link was issued so users can
    // see whether they're acting on a stale email.
    expect(res.text).toContain("issued on");
    expect(res.text).toContain("February 10, 2026");

    // The user's preference flag was actually flipped.
    const owner = findUser("owner-1")!;
    expect(owner.emailNotifyDormantTokens).toBe(false);
    expect(owner.dormantTokensSnoozeUntil).toBeNull();
    expect(owner.dormantTokensUnsubscribedAt).toBeInstanceOf(Date);
  });
});
