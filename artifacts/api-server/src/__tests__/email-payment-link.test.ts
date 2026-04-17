import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

type Row = Record<string, unknown>;

interface Fixtures {
  invoice: Row | null;
  project: Row | null;
  clientUser: Row | null;
  organization: Row | null;
}

const fixtures: Fixtures = {
  invoice: null,
  project: null,
  clientUser: null,
  organization: null,
};

const updateCalls: { table: string; values: Row }[] = [];

function tableName(table: any): string {
  return (table && table.__name) || "unknown";
}

function selectChain(table: any) {
  const name = tableName(table);
  const rowsForTable = (): Row[] => {
    if (name === "invoices" && fixtures.invoice) return [fixtures.invoice];
    if (name === "projects" && fixtures.project) return [fixtures.project];
    if (name === "users" && fixtures.clientUser) return [fixtures.clientUser];
    if (name === "organizations" && fixtures.organization) return [fixtures.organization];
    return [];
  };
  return {
    where: () => ({
      limit: async () => rowsForTable(),
    }),
  };
}

function makeDb(): any {
  return {
    select: (_proj?: any) => ({
      from: (table: any) => selectChain(table),
    }),
    update: (table: any) => ({
      set: (vals: Row) => ({
        where: () => ({
          returning: async () => {
            updateCalls.push({ table: tableName(table), values: vals });
            const merged = { ...(fixtures.invoice ?? {}), ...vals };
            return [merged];
          },
        }),
      }),
    }),
    insert: (_table: any) => ({
      values: (_v: any) => ({ returning: async () => [] }),
    }),
    delete: (_table: any) => ({ where: () => Promise.resolve() }),
  };
}

vi.mock("@workspace/db", () => {
  return {
    db: makeDb(),
    integrationSettingsTable: { __name: "integration_settings" },
    invoicesTable: { __name: "invoices", id: "id", projectId: "projectId" },
    projectsTable: { __name: "projects", id: "id" },
    usersTable: {
      __name: "users",
      id: "id",
      email: "email",
      name: "name",
      role: "role",
    },
    organizationsTable: {
      __name: "organizations",
      id: "id",
      contactEmail: "contactEmail",
      contactName: "contactName",
    },
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
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return { ...actual, eq: (_col: any, val: any) => ({ __op: "eq", val }) };
});

const sendEmailMock = vi.fn(async () => undefined);
const createCheckoutSessionMock = vi.fn(async () => ({ url: "https://stripe.test/session/abc" }));

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
  createCheckoutSession: (...args: unknown[]) =>
    createCheckoutSessionMock(...(args as [])),
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

vi.mock("../middleware/project-access", () => ({
  requireProjectAccess: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireProjectAccessViaEntity: () =>
    (_req: Request, _res: Response, next: NextFunction) => next(),
  resolveProjectFromInvoice: async () => "project-1",
}));

import integrationsRouter from "../routes/integrations";

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { id: "owner-1", email: "owner@x.com", name: "Owner", role: "owner" };
    next();
  });
  app.use("/api", integrationsRouter);
  return app;
}

function baseInvoice(overrides: Partial<Row> = {}): Row {
  return {
    id: "inv-1",
    projectId: "project-1",
    invoiceNumber: "INV-001",
    description: "Phase 1 deposit",
    amount: 1500,
    status: "sent",
    dueDate: new Date("2026-05-01T00:00:00Z"),
    paymentLinkSentAt: null,
    paymentLinkSentTo: null,
    ...overrides,
  };
}

function baseProject(overrides: Partial<Row> = {}): Row {
  return {
    id: "project-1",
    name: "Brand Film",
    clientId: "client-1",
    organizationId: "org-1",
    ...overrides,
  };
}

describe("POST /api/invoices/:id/email-payment-link", () => {
  let app: Express;

  beforeEach(() => {
    fixtures.invoice = null;
    fixtures.project = null;
    fixtures.clientUser = null;
    fixtures.organization = null;
    updateCalls.length = 0;
    sendEmailMock.mockClear();
    createCheckoutSessionMock.mockClear();
    createCheckoutSessionMock.mockResolvedValue({ url: "https://stripe.test/session/abc" });
    app = buildApp();
  });

  it("happy path: emails the link and stamps paymentLinkSentAt + paymentLinkSentTo from the project's client", async () => {
    fixtures.invoice = baseInvoice();
    fixtures.project = baseProject();
    fixtures.clientUser = { id: "client-1", email: "client@example.com", name: "Client Person" };

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(200);
    expect(createCheckoutSessionMock).toHaveBeenCalledTimes(1);
    expect(createCheckoutSessionMock).toHaveBeenCalledWith(
      "inv-1",
      "http://localhost:5000/client/billing?payment=success",
      "http://localhost:5000/client/billing?payment=canceled",
    );
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmailMock.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
    expect(emailArgs.to).toBe("client@example.com");
    expect(emailArgs.subject).toContain("INV-001");
    expect(emailArgs.text).toContain("https://stripe.test/session/abc");

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].table).toBe("invoices");
    expect(updateCalls[0].values.paymentLinkSentTo).toBe("client@example.com");
    expect(updateCalls[0].values.paymentLinkSentAt).toBeInstanceOf(Date);

    expect(res.body.paymentLinkSentTo).toBe("client@example.com");
    expect(res.body.paymentLinkSentAt).toBeDefined();
  });

  it("falls back to organization.contactEmail when the project has no clientId", async () => {
    fixtures.invoice = baseInvoice();
    fixtures.project = baseProject({ clientId: null });
    fixtures.organization = {
      id: "org-1",
      contactEmail: "ap@bigco.com",
      contactName: "Accounts Payable",
    };

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect((sendEmailMock.mock.calls[0][0] as { to: string }).to).toBe("ap@bigco.com");
    expect(updateCalls[0].values.paymentLinkSentTo).toBe("ap@bigco.com");
  });

  it("falls back to organization.contactEmail when the client user has no email", async () => {
    fixtures.invoice = baseInvoice();
    fixtures.project = baseProject();
    fixtures.clientUser = { id: "client-1", email: null, name: "Client Person" };
    fixtures.organization = {
      id: "org-1",
      contactEmail: "ap@bigco.com",
      contactName: "Accounts Payable",
    };

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(200);
    expect((sendEmailMock.mock.calls[0][0] as { to: string }).to).toBe("ap@bigco.com");
  });

  it("returns 400 when no client contact email is found anywhere", async () => {
    fixtures.invoice = baseInvoice();
    fixtures.project = baseProject({ clientId: null, organizationId: null });

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no client contact email/i);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(updateCalls).toHaveLength(0);
  });

  it("returns 400 when Stripe is not connected (createCheckoutSession returns null)", async () => {
    fixtures.invoice = baseInvoice();
    fixtures.project = baseProject();
    fixtures.clientUser = { id: "client-1", email: "client@example.com", name: "Client" };
    createCheckoutSessionMock.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Stripe/i);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(updateCalls).toHaveLength(0);
  });

  for (const status of ["draft", "paid", "void"] as const) {
    it(`returns 400 when invoice status is "${status}" (gating only sent/overdue)`, async () => {
      fixtures.invoice = baseInvoice({ status });
      fixtures.project = baseProject();
      fixtures.clientUser = { id: "client-1", email: "client@example.com", name: "Client" };

      const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/sent or overdue/i);
      expect(createCheckoutSessionMock).not.toHaveBeenCalled();
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(updateCalls).toHaveLength(0);
    });
  }

  it("allows status=overdue (also stamps timestamps)", async () => {
    fixtures.invoice = baseInvoice({ status: "overdue" });
    fixtures.project = baseProject();
    fixtures.clientUser = { id: "client-1", email: "client@example.com", name: "Client" };

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(200);
    expect(updateCalls[0].values.paymentLinkSentAt).toBeInstanceOf(Date);
    expect(updateCalls[0].values.paymentLinkSentTo).toBe("client@example.com");
  });

  it("returns 404 when the invoice does not exist", async () => {
    fixtures.invoice = null;

    const res = await request(app).post("/api/invoices/inv-1/email-payment-link").send({});

    expect(res.status).toBe(404);
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
