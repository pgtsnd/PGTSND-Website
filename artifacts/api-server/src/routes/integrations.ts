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
import { requireProjectAccess } from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import * as stripeService from "../services/stripe";
import * as driveService from "../services/google-drive";
import * as slackService from "../services/slack";
import * as docuSignService from "../services/docusign";

const router = Router();

router.get(
  "/integrations",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const settings = await db.select().from(integrationSettingsTable);

    const types = ["stripe", "google_drive", "slack", "docusign"] as const;
    const result = types.map((type) => {
      const existing = settings.find((s) => s.type === type);
      if (existing) {
        const safeConfig: Record<string, string> = {};
        if (existing.config) {
          for (const [key, value] of Object.entries(existing.config)) {
            if (typeof value === "string" && value.length > 8) {
              safeConfig[key] = value.slice(0, 4) + "••••" + value.slice(-4);
            } else {
              safeConfig[key] = String(value);
            }
          }
        }
        return {
          id: existing.id,
          type: existing.type,
          enabled: existing.enabled,
          config: safeConfig,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        };
      }
      return {
        id: null,
        type,
        enabled: false,
        config: {},
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

    if (existing) {
      const mergedConfig = { ...existing.config };
      if (config) {
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === "string" && !value.includes("••••")) {
            mergedConfig[key] = value;
          }
        }
      }

      const [updated] = await db
        .update(integrationSettingsTable)
        .set({
          enabled: enabled ?? existing.enabled,
          config: mergedConfig,
        })
        .where(eq(integrationSettingsTable.id, existing.id))
        .returning();

      if (type === "stripe") stripeService.resetStripeClient();

      res.json({ message: "Integration updated", type, enabled: updated.enabled });
    } else {
      const [created] = await db
        .insert(integrationSettingsTable)
        .values({
          type: type as any,
          enabled: enabled ?? false,
          config: config ?? {},
        })
        .returning();

      res.status(201).json({ message: "Integration created", type, enabled: created.enabled });
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
    try {
      const invoice = await stripeService.createInvoice({
        projectId: req.params.projectId,
        description: req.body.description,
        amount: req.body.amount,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        customerEmail: req.body.customerEmail,
      });
      validateAndSend(res, selectInvoiceSchema, invoice, 201);
    } catch (err) {
      res.status(500).json({ error: "Failed to create invoice" });
    }
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
  "/webhooks/stripe",
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    try {
      const rawBody = JSON.stringify(req.body);
      await stripeService.handleStripeWebhook(rawBody, sig);
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  },
);

router.get(
  "/integrations/drive/files",
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
