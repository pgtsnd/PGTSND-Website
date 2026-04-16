import { Router } from "express";
import {
  db,
  integrationSettingsTable,
  invoicesTable,
  insertInvoiceSchema,
  updateInvoiceSchema,
  selectInvoiceSchema,
  selectIntegrationSettingsSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth";
import { requireProjectAccess, requireProjectAccessViaEntity, resolveProjectFromInvoice } from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import * as stripeService from "../services/stripe";
import * as driveService from "../services/google-drive";
import * as slackService from "../services/slack";
import * as docuSignService from "../services/docusign";
import { encryptConfig, maskConfig, decryptConfig, isVaultReady } from "../services/vault";

const router = Router();

router.get(
  "/integrations",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const settings = await db.select().from(integrationSettingsTable);
    const vaultActive = isVaultReady();

    const types = ["stripe", "google_drive", "slack", "docusign"] as const;
    const result = types.map((type) => {
      const existing = settings.find((s) => s.type === type);
      if (existing) {
        const safeConfig = existing.config
          ? (vaultActive ? maskConfig(existing.config) : (() => {
              const masked: Record<string, string> = {};
              for (const [key, value] of Object.entries(existing.config!)) {
                if (typeof value === "string" && value.length > 8) {
                  masked[key] = value.slice(0, 4) + "••••" + value.slice(-4);
                } else {
                  masked[key] = String(value);
                }
              }
              return masked;
            })())
          : {};
        return {
          id: existing.id,
          type: existing.type,
          enabled: existing.enabled,
          config: safeConfig,
          encrypted: vaultActive,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        };
      }
      return {
        id: null,
        type,
        enabled: false,
        config: {},
        encrypted: false,
        createdAt: null,
        updatedAt: null,
      };
    });

    res.json(result);
  },
);

router.get(
  "/integrations/status",
  async (_req, res) => {
    const [stripe, drive, slack, docusign] = await Promise.all([
      stripeService.isStripeConnected(),
      driveService.isDriveConnected(),
      slackService.isSlackConnected(),
      docuSignService.isDocuSignConnected(),
    ]);

    res.json({ stripe, google_drive: drive, slack, docusign });
  },
);

router.get(
  "/integrations/vault",
  requireRole("owner"),
  async (_req, res) => {
    const vaultActive = isVaultReady();
    const settings = await db.select().from(integrationSettingsTable);
    const total = settings.filter((s) => s.config && Object.keys(s.config).length > 0).length;

    let encryptedCount = 0;
    if (vaultActive) {
      for (const s of settings) {
        if (!s.config) continue;
        const values = Object.values(s.config);
        const isEnc = values.some((v) => typeof v === "string" && v.includes(":") && v.split(":").length === 3);
        if (isEnc) encryptedCount++;
      }
    }

    res.json({
      active: vaultActive,
      totalWithKeys: total,
      encryptedCount,
      unencryptedCount: total - encryptedCount,
    });
  },
);

router.post(
  "/integrations/vault/encrypt-existing",
  requireRole("owner"),
  async (_req, res) => {
    if (!isVaultReady()) {
      res.status(400).json({ error: "Vault master key not configured" });
      return;
    }

    const settings = await db.select().from(integrationSettingsTable);
    let migrated = 0;

    for (const s of settings) {
      if (!s.config || Object.keys(s.config).length === 0) continue;

      const values = Object.values(s.config);
      const alreadyEncrypted = values.some((v) => typeof v === "string" && v.includes(":") && v.split(":").length === 3);
      if (alreadyEncrypted) continue;

      const encrypted = encryptConfig(s.config);
      await db
        .update(integrationSettingsTable)
        .set({ config: encrypted })
        .where(eq(integrationSettingsTable.id, s.id));
      migrated++;
    }

    res.json({ message: `Encrypted ${migrated} integration(s)`, migrated });
  },
);

router.put(
  "/integrations/:type",
  requireRole("owner", "partner"),
  async (req, res) => {
    const validTypes = ["stripe", "google_drive", "slack", "docusign"];
    const { type } = req.params;

    if (!validTypes.includes(type)) {
      res.status(400).json({ error: "Invalid integration type" });
      return;
    }

    const { enabled, config } = req.body;

    const [existing] = await db
      .select()
      .from(integrationSettingsTable)
      .where(eq(integrationSettingsTable.type, type as any))
      .limit(1);

    const vaultActive = isVaultReady();

    if (existing) {
      const existingPlain = vaultActive && existing.config
        ? decryptConfig(existing.config)
        : (existing.config ?? {});
      const mergedConfig = { ...existingPlain };
      if (config) {
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === "string" && !value.includes("••••")) {
            (mergedConfig as Record<string, string>)[key] = value as string;
          }
        }
      }

      const finalConfig = vaultActive
        ? encryptConfig(mergedConfig as Record<string, string>)
        : mergedConfig;

      const [updated] = await db
        .update(integrationSettingsTable)
        .set({
          enabled: enabled ?? existing.enabled,
          config: finalConfig as Record<string, string>,
        })
        .where(eq(integrationSettingsTable.id, existing.id))
        .returning();

      if (type === "stripe") stripeService.resetStripeClient();

      res.json({ message: "Integration updated", type, enabled: updated.enabled, encrypted: vaultActive });
    } else {
      const finalConfig = vaultActive && config
        ? encryptConfig(config)
        : (config ?? {});

      const [created] = await db
        .insert(integrationSettingsTable)
        .values({
          type: type as any,
          enabled: enabled ?? false,
          config: finalConfig,
        })
        .returning();

      res.status(201).json({ message: "Integration created", type, enabled: created.enabled, encrypted: vaultActive });
    }
  },
);

router.delete(
  "/integrations/:type",
  requireRole("owner"),
  async (req, res) => {
    const { type } = req.params;

    await db
      .delete(integrationSettingsTable)
      .where(eq(integrationSettingsTable.type, type as any));

    if (type === "stripe") stripeService.resetStripeClient();

    res.json({ message: "Integration disconnected" });
  },
);

router.get(
  "/invoices",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const invoices = await db.select().from(invoicesTable);
    validateAndSendArray(res, selectInvoiceSchema, invoices);
  },
);

router.get(
  "/projects/:projectId/invoices",
  requireProjectAccess("projectId"),
  async (req, res) => {
    const invoices = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.projectId, req.params.projectId));
    validateAndSendArray(res, selectInvoiceSchema, invoices);
  },
);

router.post(
  "/projects/:projectId/invoices",
  requireRole("owner", "partner"),
  requireProjectAccess("projectId"),
  async (req, res) => {
    const parsed = insertInvoiceSchema.safeParse({
      ...req.body,
      projectId: req.params.projectId,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const [invoice] = await db.insert(invoicesTable).values(parsed.data).returning();
    validateAndSend(res, selectInvoiceSchema, invoice, 201);
  },
);

router.delete(
  "/invoices/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [invoice] = await db
      .delete(invoicesTable)
      .where(eq(invoicesTable.id, req.params.id))
      .returning();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json({ message: "Invoice deleted" });
  },
);

router.patch(
  "/invoices/:id",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parsed = updateInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const [invoice] = await db
      .update(invoicesTable)
      .set(parsed.data)
      .where(eq(invoicesTable.id, req.params.id))
      .returning();

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    validateAndSend(res, selectInvoiceSchema, invoice);
  },
);

router.post(
  "/invoices/:id/send",
  requireRole("owner", "partner"),
  async (req, res) => {
    const invoice = await stripeService.sendInvoice(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    validateAndSend(res, selectInvoiceSchema, invoice);
  },
);

router.post(
  "/invoices/:id/checkout",
  requireProjectAccessViaEntity(resolveProjectFromInvoice, "id"),
  async (req, res) => {
    const { successUrl, cancelUrl } = req.body;
    if (!successUrl || !cancelUrl) {
      res.status(400).json({ error: "successUrl and cancelUrl are required" });
      return;
    }

    const requestOrigin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    try {
      const successOrigin = new URL(successUrl).origin;
      const cancelOrigin = new URL(cancelUrl).origin;
      if (successOrigin !== requestOrigin || cancelOrigin !== requestOrigin) {
        res.status(400).json({ error: "Redirect URLs must match the application origin" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Invalid redirect URLs" });
      return;
    }

    try {
      const result = await stripeService.createCheckoutSession(
        req.params.id,
        successUrl,
        cancelUrl,
      );

      if (!result) {
        res.status(404).json({ error: "Invoice not found, already paid, or Stripe not connected" });
        return;
      }

      res.json(result);
    } catch (err) {
      console.error("Checkout session creation failed:", err);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

router.get(
  "/invoices/:id/payment",
  requireProjectAccessViaEntity(resolveProjectFromInvoice, "id"),
  async (req, res) => {
    const details = await stripeService.getPaymentDetails(req.params.id);
    if (!details) {
      res.status(404).json({ error: "Payment details not found" });
      return;
    }
    res.json(details);
  },
);

router.post(
  "/webhooks/stripe",
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      await stripeService.handleStripeWebhook(rawBody, sig);
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  },
);

router.get(
  "/integrations/drive/files",
  requireRole("owner", "partner", "crew"),
  async (req, res) => {
    const folderId = req.query.folderId as string;
    if (!folderId) {
      res.status(400).json({ error: "folderId query parameter required" });
      return;
    }

    const files = await driveService.listFiles(folderId);
    res.json(files);
  },
);

router.get(
  "/integrations/drive/files/:fileId",
  requireRole("owner", "partner", "crew"),
  async (req, res) => {
    const file = await driveService.getFileMetadata(req.params.fileId);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.json(file);
  },
);

router.get(
  "/integrations/drive/files/:fileId/download",
  requireRole("owner", "partner", "crew"),
  async (req, res) => {
    const url = await driveService.getDownloadUrl(req.params.fileId);
    if (!url) {
      res.status(404).json({ error: "Download URL not available" });
      return;
    }
    res.json({ url });
  },
);

router.post(
  "/integrations/slack/messages",
  requireRole("owner", "partner", "crew"),
  async (req, res) => {
    const { channelId, text, threadTs } = req.body;
    if (!channelId || !text) {
      res.status(400).json({ error: "channelId and text are required" });
      return;
    }

    const message = await slackService.sendMessage(channelId, text, threadTs);
    if (!message) {
      res.status(500).json({ error: "Failed to send message" });
      return;
    }
    res.json(message);
  },
);

router.get(
  "/integrations/slack/channels",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const channels = await slackService.listChannels();
    res.json(channels);
  },
);

router.get(
  "/integrations/slack/channels/:channelId/history",
  requireRole("owner", "partner"),
  async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await slackService.getChannelHistory(req.params.channelId, limit);
    res.json(messages);
  },
);

router.post(
  "/integrations/docusign/send",
  requireRole("owner", "partner"),
  async (req, res) => {
    const { contractId, documentBase64, documentName, signerEmail, signerName, subject } = req.body;

    if (!contractId || !signerEmail || !signerName) {
      res.status(400).json({ error: "contractId, signerEmail, and signerName are required" });
      return;
    }

    const result = await docuSignService.sendEnvelope({
      contractId,
      documentBase64: documentBase64 || "",
      documentName: documentName || "Contract.pdf",
      signerEmail,
      signerName,
      subject: subject || "Please sign this document",
    });

    if (!result) {
      res.status(500).json({ error: "Failed to send envelope" });
      return;
    }

    res.json(result);
  },
);

router.get(
  "/integrations/docusign/signing-url/:contractId",
  requireRole("owner", "partner", "crew"),
  async (req, res) => {
    const returnUrl = (req.query.returnUrl as string) || `${req.protocol}://${req.get("host")}/contracts`;
    const url = await docuSignService.getSigningUrl(req.params.contractId, returnUrl);

    if (!url) {
      res.status(404).json({ error: "Signing URL not available" });
      return;
    }

    res.json({ url });
  },
);

router.post(
  "/webhooks/docusign",
  async (req, res) => {
    try {
      await docuSignService.handleDocuSignWebhook(req.body);
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  },
);

export default router;
