import { describe, it, expect, beforeEach, vi } from "vitest";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import request from "supertest";

const sendEmailMock = vi.fn(async () => undefined);

const updateCalls: { table: string; values: Record<string, unknown> }[] = [];
let updatedUser: Record<string, unknown> | null = null;

vi.mock("@workspace/db", () => {
  const usersTable = {
    __name: "users",
    id: "id",
    email: "email",
    name: "name",
    role: "role",
    bookkeeperEmail: "bookkeeperEmail",
  };
  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [] }),
        }),
      }),
      update: (table: any) => ({
        set: (vals: Record<string, unknown>) => ({
          where: () => ({
            returning: async () => {
              updateCalls.push({ table: table?.__name ?? "?", values: vals });
              updatedUser = {
                id: "owner-1",
                email: "owner@x.com",
                name: "Owner",
                role: "owner",
                ...vals,
              };
              return [updatedUser];
            },
          }),
        }),
      }),
      insert: () => ({ values: () => ({ returning: async () => [] }) }),
      delete: () => ({ where: () => Promise.resolve() }),
    },
    usersTable,
    integrationSettingsTable: { __name: "integration_settings" },
    invoicesTable: { __name: "invoices", id: "id", projectId: "projectId" },
    projectsTable: { __name: "projects", id: "id" },
    organizationsTable: { __name: "organizations", id: "id" },
    scheduledInvoiceExportsTable: { __name: "scheduled_invoice_exports" },
    invoiceExportRunsTable: { __name: "invoice_export_runs" },
    insertInvoiceSchema: { safeParse: () => ({ success: false, error: { issues: [] } }) },
    updateInvoiceSchema: { safeParse: () => ({ success: false, error: { issues: [] } }) },
    selectInvoiceSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
    selectIntegrationSettingsSchema: {
      safeParse: (d: unknown) => ({ success: true, data: d }),
    },
    scheduledInvoiceExportFiltersSchema: {
      safeParse: (d: unknown) => ({ success: true, data: d }),
    },
    scheduledInvoiceExportRecipientsSchema: {
      safeParse: (d: unknown) => ({ success: true, data: Array.isArray(d) ? d : [] }),
    },
    insertUserSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
    updateUserSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
    selectUserSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return { ...actual, eq: (_col: any, val: any) => ({ __op: "eq", val }) };
});

vi.mock("../services/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...(args as [])),
  getAppBaseUrl: () => "http://localhost:5000",
}));

vi.mock("../services/email-templates", () => ({
  renderPaymentLinkEmail: () => "<html>payment</html>",
}));

vi.mock("../services/stripe", () => ({
  isStripeConnected: async () => true,
  resetStripeClient: () => {},
  sendInvoice: async () => null,
  createCheckoutSession: async () => null,
  getPaymentDetails: async () => null,
  handleStripeWebhook: async () => {},
}));

vi.mock("../services/google-drive", () => ({
  isDriveConnected: async () => false,
  listFolders: async () => [],
  listFiles: async () => [],
  getFileMetadata: async () => null,
  getDownloadUrl: async () => null,
}));

vi.mock("../services/slack", () => ({
  isSlackConnected: async () => false,
  sendMessage: async () => null,
  listChannels: async () => [],
  getChannelHistory: async () => [],
}));

vi.mock("../services/docusign", () => ({
  isDocuSignConnected: async () => false,
  sendEnvelope: async () => null,
  getSigningUrl: async () => null,
  handleDocuSignWebhook: async () => {},
}));

vi.mock("../middleware/auth", () => ({
  requireRole:
    () => (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = {
        id: "owner-1",
        email: "owner@x.com",
        name: "Owner",
        role: "owner",
      };
      next();
    },
}));

vi.mock("../middleware/project-access", () => ({
  requireProjectAccess: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireProjectAccessViaEntity: () =>
    (_req: Request, _res: Response, next: NextFunction) => next(),
  resolveProjectFromInvoice: async () => "project-1",
}));

import integrationsRouter from "../routes/integrations";
import usersRouter from "../routes/users";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = {
      id: "owner-1",
      email: "owner@x.com",
      name: "Owner",
      role: "owner",
    };
    next();
  });
  app.use("/api", integrationsRouter);
  app.use("/api", usersRouter);
  return app;
}

const VALID_CSV = "id,amount\n1,100\n";

function exportPayload(extra: Record<string, unknown>) {
  return {
    csv: VALID_CSV,
    filename: "invoices.csv",
    summary: { count: 1, totalAmount: 100 },
    ...extra,
  };
}

describe("POST /api/integrations/invoices/email-export — multi-recipient handling", () => {
  let app: Express;

  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    updateCalls.length = 0;
    updatedUser = null;
    app = buildApp();
  });

  it("accepts a `recipients` array and forwards all addresses to To", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: ["a@x.com", "b@x.com", "c@x.com"] }));

    expect(res.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(args.cc).toBeUndefined();
    expect(res.body.recipients).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(res.body.cc).toEqual([]);
    expect(res.body.recipient).toBe("a@x.com");
  });

  it("accepts a comma-separated `recipients` string and trims/splits it", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: " a@x.com , b@x.com ,c@x.com" }));

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("supports mixed To + CC arrays", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com", "b@x.com"],
          cc: ["cc1@x.com", "cc2@x.com"],
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com"]);
    expect(args.cc).toEqual(["cc1@x.com", "cc2@x.com"]);
    expect(res.body.cc).toEqual(["cc1@x.com", "cc2@x.com"]);
  });

  it("dedupes CC entries that already appear in To (case-insensitive)", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com", "B@x.com"],
          cc: ["a@X.com", "cc@x.com", "b@x.com"],
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toEqual(["a@x.com", "B@x.com"]);
    expect(args.cc).toEqual(["cc@x.com"]);
    expect(res.body.cc).toEqual(["cc@x.com"]);
  });

  it("dedupes duplicate entries within the To list (case-insensitive)", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: ["a@x.com", "A@x.com", "b@x.com"] }));

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com"]);
  });

  it("rejects an invalid email address with 400 and does not send", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: ["a@x.com", "not-an-email"] }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email address/i);
    expect(res.body.error).toContain("not-an-email");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid CC address with 400 and does not send", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com"],
          cc: ["ok@x.com", "bad@@nope"],
        }),
      );

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email address/i);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when total recipients (To + CC) exceed the 25 cap", async () => {
    const to = Array.from({ length: 13 }, (_, i) => `to${i}@x.com`);
    const cc = Array.from({ length: 13 }, (_, i) => `cc${i}@x.com`);
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: to, cc }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too many recipients/i);
    expect(res.body.error).toContain("25");
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("allows exactly 25 total recipients (boundary)", async () => {
    const to = Array.from({ length: 20 }, (_, i) => `to${i}@x.com`);
    const cc = Array.from({ length: 5 }, (_, i) => `cc${i}@x.com`);
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: to, cc }));

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toHaveLength(20);
    expect(args.cc).toHaveLength(5);
  });

  it("supports the legacy single `recipient` field", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipient: "legacy@x.com" }));

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[] };
    expect(args.to).toEqual(["legacy@x.com"]);
    expect(res.body.recipient).toBe("legacy@x.com");
    expect(res.body.recipients).toEqual(["legacy@x.com"]);
  });

  it("legacy `recipient` accepts a comma-separated string too", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipient: "a@x.com, b@x.com" }));

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com"]);
  });

  it("prefers `recipients` over the legacy `recipient` when both are sent", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipient: "legacy@x.com",
          recipients: ["new@x.com"],
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[] };
    expect(args.to).toEqual(["new@x.com"]);
  });

  it("returns 400 when no recipients are provided at all", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({}));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one recipient/i);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 400 when recipients is an empty array", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(exportPayload({ recipients: [] }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one recipient/i);
  });

  it("accepts a comma-separated `cc` string", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com"],
          cc: "cc1@x.com, cc2@x.com ,cc3@x.com",
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toEqual(["a@x.com"]);
    expect(args.cc).toEqual(["cc1@x.com", "cc2@x.com", "cc3@x.com"]);
    expect(res.body.cc).toEqual(["cc1@x.com", "cc2@x.com", "cc3@x.com"]);
  });

  it("supports mixed formats: `recipients` array plus comma-separated `cc` string", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com", "b@x.com"],
          cc: "a@x.com, cc1@x.com, cc2@x.com",
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { to: string[]; cc?: string[] };
    expect(args.to).toEqual(["a@x.com", "b@x.com"]);
    expect(args.cc).toEqual(["cc1@x.com", "cc2@x.com"]);
  });

  it("omits the cc field on sendEmail when no CC remains after dedupe", async () => {
    const res = await request(app)
      .post("/api/integrations/invoices/email-export")
      .send(
        exportPayload({
          recipients: ["a@x.com"],
          cc: ["a@x.com"],
        }),
      );

    expect(res.status).toBe(200);
    const args = sendEmailMock.mock.calls[0][0] as { cc?: string[] };
    expect(args.cc).toBeUndefined();
    expect(res.body.cc).toEqual([]);
  });
});

describe("PATCH /api/users/me/bookkeeper-email — multi-recipient handling", () => {
  let app: Express;

  beforeEach(() => {
    updateCalls.length = 0;
    updatedUser = null;
    app = buildApp();
  });

  it("accepts a comma-separated string and stores it joined with ', '", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: "a@x.com,b@x.com,c@x.com" });

    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].values.bookkeeperEmail).toBe("a@x.com, b@x.com, c@x.com");
  });

  it("trims whitespace around each address", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: "  a@x.com ,   b@x.com  " });

    expect(res.status).toBe(200);
    expect(updateCalls[0].values.bookkeeperEmail).toBe("a@x.com, b@x.com");
  });

  it("dedupes case-insensitively while preserving the first casing", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: "A@x.com, a@x.com, b@x.com, B@X.com" });

    expect(res.status).toBe(200);
    expect(updateCalls[0].values.bookkeeperEmail).toBe("A@x.com, b@x.com");
  });

  it("rejects malformed addresses with 400 and does not update", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: "a@x.com, not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email address/i);
    expect(res.body.error).toContain("not-an-email");
    expect(updateCalls).toHaveLength(0);
  });

  it("enforces the 10-entry cap", async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `b${i}@x.com`).join(", ");
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: eleven });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too many bookkeeper email/i);
    expect(res.body.error).toContain("10");
    expect(updateCalls).toHaveLength(0);
  });

  it("allows exactly 10 entries (boundary)", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => `b${i}@x.com`).join(", ");
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: ten });

    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(1);
    const stored = updateCalls[0].values.bookkeeperEmail as string;
    expect(stored.split(", ")).toHaveLength(10);
  });

  it("clears the value when given an empty string", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: "" });

    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].values.bookkeeperEmail).toBeNull();
  });

  it("clears the value when given only commas/whitespace", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: " , , " });

    expect(res.status).toBe(200);
    expect(updateCalls[0].values.bookkeeperEmail).toBeNull();
  });

  it("clears the value when given null", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: null });

    expect(res.status).toBe(200);
    expect(updateCalls[0].values.bookkeeperEmail).toBeNull();
  });

  it("rejects non-string, non-null values with 400", async () => {
    const res = await request(app)
      .patch("/api/users/me/bookkeeper-email")
      .send({ bookkeeperEmail: 42 });

    expect(res.status).toBe(400);
    expect(updateCalls).toHaveLength(0);
  });
});
