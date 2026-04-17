import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";

const OLD_KEY = "old-master-key-aaaa-1111";
const NEW_KEY = "new-master-key-bbbb-2222";

type Row = {
  id: string;
  type: string;
  enabled: boolean;
  config: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
};

const state: { rows: Row[] } = { rows: [] };

function snapshotRows(): Row[] {
  return state.rows.map((r) => ({
    ...r,
    config: r.config ? { ...r.config } : r.config,
  }));
}

function makeDb(): any {
  return {
    select: () => ({ from: () => Promise.resolve(state.rows) }),
    update: (_table: any) => ({
      set: (vals: any) => ({
        where: (pred: any) => {
          const id = pred?.val;
          const row = state.rows.find((r) => r.id === id);
          if (row) Object.assign(row, vals);
          return Promise.resolve();
        },
      }),
    }),
    insert: (_table: any) => ({
      values: (_v: any) => ({ returning: async () => [] }),
    }),
    delete: (_table: any) => ({ where: () => Promise.resolve() }),
    transaction: async (fn: any) => {
      const snap = snapshotRows();
      try {
        return await fn(makeDb());
      } catch (e) {
        state.rows = snap;
        throw e;
      }
    },
  };
}

vi.mock("@workspace/db", () => {
  return {
    db: makeDb(),
    integrationSettingsTable: { id: "id" },
    usersTable: { id: "id", email: "email", name: "name", role: "role" },
    invoicesTable: {},
    insertInvoiceSchema: { safeParse: () => ({ success: false, error: { issues: [] } }) },
    updateInvoiceSchema: { safeParse: () => ({ success: false, error: { issues: [] } }) },
    selectInvoiceSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
    selectIntegrationSettingsSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) },
  };
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return { ...actual, eq: (_col: any, val: any) => ({ __op: "eq", val }) };
});

vi.mock("../services/stripe", () => ({
  isStripeConnected: async () => false,
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

vi.mock("../middleware/project-access", () => ({
  requireProjectAccess: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireProjectAccessViaEntity: () =>
    (_req: Request, _res: Response, next: NextFunction) => next(),
  resolveProjectFromInvoice: async () => null,
}));

import integrationsRouter from "../routes/integrations";
import { encryptWithKey, decryptWithKey, deriveKey } from "../services/vault";

function buildApp(role: string = "owner"): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { id: "u1", email: "owner@x.com", name: "Owner", role };
    next();
  });
  app.use("/api", integrationsRouter);
  return app;
}

function makeRow(
  id: string,
  type: string,
  key: Buffer,
  vals: Record<string, string>,
): Row {
  const enc: Record<string, string> = {};
  for (const [k, v] of Object.entries(vals)) enc[k] = encryptWithKey(v, key);
  return {
    id,
    type,
    enabled: true,
    config: enc,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("POST /api/integrations/vault/rotate", () => {
  let app: Express;

  beforeEach(() => {
    process.env.VAULT_MASTER_KEY = OLD_KEY;
    state.rows = [];
    app = buildApp();
  });

  it("requires owner role (403 for partner)", async () => {
    const partnerApp = buildApp("partner");
    const res = await request(partnerApp)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });
    expect(res.status).toBe(403);
  });

  it("rejects when oldKey is missing", async () => {
    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ newKey: NEW_KEY });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/oldKey is required/);
  });

  it("rejects when newKey is missing", async () => {
    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/newKey is required/);
  });

  it("rejects when oldKey === newKey", async () => {
    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: OLD_KEY });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must differ/);
  });

  it("rejects when oldKey does not match the active VAULT_MASTER_KEY", async () => {
    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: "wrong-key", newKey: NEW_KEY });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not match the active master key/);
  });

  it("returns 400 when VAULT_MASTER_KEY is not configured on the server", async () => {
    delete process.env.VAULT_MASTER_KEY;
    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not configured/);
  });

  it("re-encrypts every row's encrypted values under the new key on success", async () => {
    const oldDerived = deriveKey(OLD_KEY);
    state.rows = [
      makeRow("r1", "stripe", oldDerived, {
        secretKey: "sk_live_abc123",
        publishableKey: "pk_live_xyz789",
      }),
      makeRow("r2", "slack", oldDerived, { botToken: "xoxb-secret-token" }),
      makeRow("r3", "docusign", oldDerived, { accountId: "acct-1234567890" }),
    ];
    const beforeCipher = JSON.parse(JSON.stringify(state.rows));

    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      rowsRotated: 3,
      valuesRotated: 4,
      valuesSkipped: 0,
    });

    const newDerived = deriveKey(NEW_KEY);

    // Every value must now decrypt with the new key back to its original plaintext
    expect(decryptWithKey(state.rows[0].config!.secretKey, newDerived)).toBe("sk_live_abc123");
    expect(decryptWithKey(state.rows[0].config!.publishableKey, newDerived)).toBe("pk_live_xyz789");
    expect(decryptWithKey(state.rows[1].config!.botToken, newDerived)).toBe("xoxb-secret-token");
    expect(decryptWithKey(state.rows[2].config!.accountId, newDerived)).toBe("acct-1234567890");

    // Old key must no longer decrypt the rotated values
    expect(() => decryptWithKey(state.rows[0].config!.secretKey, oldDerived)).toThrow();
    expect(() => decryptWithKey(state.rows[1].config!.botToken, oldDerived)).toThrow();

    // Ciphertexts must have actually changed (not a no-op)
    expect(state.rows[0].config!.secretKey).not.toBe(beforeCipher[0].config.secretKey);
    expect(state.rows[1].config!.botToken).not.toBe(beforeCipher[1].config.botToken);
    expect(state.rows[2].config!.accountId).not.toBe(beforeCipher[2].config.accountId);
  });

  it("leaves non-encrypted values untouched and counts them as skipped", async () => {
    const oldDerived = deriveKey(OLD_KEY);
    state.rows = [
      {
        id: "r1",
        type: "slack",
        enabled: true,
        config: {
          encryptedSecret: encryptWithKey("real-secret-value", oldDerived),
          plainValue: "this-is-not-encrypted",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      rowsRotated: 1,
      valuesRotated: 1,
      valuesSkipped: 1,
    });

    expect(state.rows[0].config!.plainValue).toBe("this-is-not-encrypted");
    const newDerived = deriveKey(NEW_KEY);
    expect(decryptWithKey(state.rows[0].config!.encryptedSecret, newDerived)).toBe(
      "real-secret-value",
    );
  });

  it("skips rows with empty or null config", async () => {
    const oldDerived = deriveKey(OLD_KEY);
    state.rows = [
      {
        id: "empty",
        type: "stripe",
        enabled: false,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      makeRow("r1", "slack", oldDerived, { token: "t" }),
    ];

    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ rowsRotated: 1, valuesRotated: 1 });
  });

  it("rolls back the entire transaction when a mid-rotation decrypt fails", async () => {
    const oldDerived = deriveKey(OLD_KEY);
    const otherDerived = deriveKey("some-completely-different-master-key");

    // r1 was encrypted with oldKey (will decrypt fine).
    // r2 was encrypted with a DIFFERENT master key — decryptWithKey(oldDerived) will throw,
    // which must abort the transaction AFTER r1 has already been processed in-memory.
    state.rows = [
      makeRow("r1", "stripe", oldDerived, { secretKey: "sk_live_should_not_change" }),
      makeRow("r2", "slack", otherDerived, { botToken: "encrypted-with-wrong-key" }),
    ];
    const beforeSerialized = JSON.parse(JSON.stringify(state.rows));

    const res = await request(app)
      .post("/api/integrations/vault/rotate")
      .send({ oldKey: OLD_KEY, newKey: NEW_KEY });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/decrypt|aborted|no changes were committed/i);

    // Critical invariant: not a single row may be partially updated.
    const afterSerialized = JSON.parse(JSON.stringify(state.rows));
    expect(afterSerialized).toEqual(beforeSerialized);

    // r1's ciphertext must still decrypt with the OLD key (i.e., it was not rotated).
    expect(decryptWithKey(state.rows[0].config!.secretKey, oldDerived)).toBe(
      "sk_live_should_not_change",
    );
    // And must NOT decrypt with the new key.
    const newDerived = deriveKey(NEW_KEY);
    expect(() => decryptWithKey(state.rows[0].config!.secretKey, newDerived)).toThrow();
  });

  it("rolls back when the underlying transaction fails (e.g., DB error during update)", async () => {
    const oldDerived = deriveKey(OLD_KEY);
    state.rows = [
      makeRow("r1", "stripe", oldDerived, { secretKey: "sk_live_aaa" }),
      makeRow("r2", "slack", oldDerived, { botToken: "xoxb-bbb" }),
    ];
    const beforeSerialized = JSON.parse(JSON.stringify(state.rows));

    // Patch the db.transaction's tx.update to throw on the SECOND update only,
    // simulating a transient DB failure mid-rotation.
    const dbModule = await import("@workspace/db");
    const realTransaction = (dbModule.db as any).transaction;
    let callCount = 0;
    (dbModule.db as any).transaction = async (fn: any) => {
      const snap = snapshotRows();
      const tx = makeDb();
      const originalUpdate = tx.update;
      tx.update = (table: any) => {
        const builder = originalUpdate(table);
        const originalSet = builder.set;
        builder.set = (vals: any) => {
          const w = originalSet(vals);
          const originalWhere = w.where;
          w.where = async (pred: any) => {
            callCount++;
            if (callCount === 2) {
              throw new Error("simulated database failure");
            }
            return originalWhere(pred);
          };
          return w;
        };
        return builder;
      };
      try {
        return await fn(tx);
      } catch (e) {
        state.rows = snap;
        throw e;
      }
    };

    try {
      const res = await request(app)
        .post("/api/integrations/vault/rotate")
        .send({ oldKey: OLD_KEY, newKey: NEW_KEY });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/no changes were committed|aborted/i);

      const afterSerialized = JSON.parse(JSON.stringify(state.rows));
      expect(afterSerialized).toEqual(beforeSerialized);

      // Original ciphertexts must still decrypt with the OLD key.
      expect(decryptWithKey(state.rows[0].config!.secretKey, oldDerived)).toBe("sk_live_aaa");
      expect(decryptWithKey(state.rows[1].config!.botToken, oldDerived)).toBe("xoxb-bbb");
    } finally {
      (dbModule.db as any).transaction = realTransaction;
    }
  });
});
