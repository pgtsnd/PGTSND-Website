import { Router } from "express";
import {
  db,
  integrationSettingsTable,
  invoicesTable,
  insertInvoiceSchema,
  updateInvoiceSchema,
  selectInvoiceSchema,
  selectIntegrationSettingsSchema,
  projectsTable,
  organizationsTable,
  usersTable,
  scheduledInvoiceExportsTable,
  invoiceExportRunsTable,
  scheduledInvoiceExportFiltersSchema,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { executeScheduledExport } from "../jobs/scheduled-invoice-exports";
import { sendEmail, getAppBaseUrl } from "../services/email";
import { renderPaymentLinkEmail } from "../services/email-templates";
import { requireRole } from "../middleware/auth";
import { requireProjectAccess, requireProjectAccessViaEntity, resolveProjectFromInvoice } from "../middleware/project-access";
import { validateAndSend, validateAndSendArray } from "../middleware/validate-response";
import * as stripeService from "../services/stripe";
import * as driveService from "../services/google-drive";
import * as slackService from "../services/slack";
import * as docuSignService from "../services/docusign";
import {
  encryptConfig,
  maskConfig,
  decryptConfig,
  isVaultReady,
  deriveKey,
  encryptWithKey,
  decryptWithKey,
  isEncryptedValue,
} from "../services/vault";
import { logger } from "../lib/logger";

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
  "/integrations/vault/rotate",
  requireRole("owner"),
  async (req, res) => {
    const { oldKey, newKey } = req.body ?? {};

    if (typeof oldKey !== "string" || oldKey.length === 0) {
      res.status(400).json({ error: "oldKey is required" });
      return;
    }
    if (typeof newKey !== "string" || newKey.length === 0) {
      res.status(400).json({ error: "newKey is required" });
      return;
    }
    if (oldKey === newKey) {
      res.status(400).json({ error: "newKey must differ from oldKey" });
      return;
    }

    const currentMaster = process.env.VAULT_MASTER_KEY;
    if (!currentMaster) {
      res.status(400).json({ error: "VAULT_MASTER_KEY is not configured on the server" });
      return;
    }
    if (oldKey !== currentMaster) {
      res.status(400).json({ error: "oldKey does not match the active master key" });
      return;
    }

    const oldDerived = deriveKey(oldKey);
    const newDerived = deriveKey(newKey);

    try {
      const result = await db.transaction(async (tx) => {
        const rows = await tx.select().from(integrationSettingsTable);

        let rowsRotated = 0;
        let valuesRotated = 0;
        let valuesSkipped = 0;

        for (const row of rows) {
          if (!row.config || Object.keys(row.config).length === 0) continue;

          const nextConfig: Record<string, string> = {};
          let changed = false;

          for (const [k, rawValue] of Object.entries(row.config)) {
            const value = String(rawValue);
            if (!isEncryptedValue(value)) {
              nextConfig[k] = value;
              valuesSkipped++;
              continue;
            }
            const plaintext = decryptWithKey(value, oldDerived);
            nextConfig[k] = encryptWithKey(plaintext, newDerived);
            valuesRotated++;
            changed = true;
          }

          if (changed) {
            await tx
              .update(integrationSettingsTable)
              .set({ config: nextConfig })
              .where(eq(integrationSettingsTable.id, row.id));
            rowsRotated++;
          }
        }

        return { rowsRotated, valuesRotated, valuesSkipped };
      });

      logger.info(
        { rowsRotated: result.rowsRotated, valuesRotated: result.valuesRotated },
        "Vault master key rotation committed",
      );

      res.json({
        message:
          "Rotation complete. Update VAULT_MASTER_KEY to the new value and restart the server.",
        ...result,
      });
    } catch (err) {
      logger.error({ err }, "Vault master key rotation failed; transaction rolled back");
      const message =
        err instanceof Error && /Unsupported state|auth|decrypt/i.test(err.message)
          ? "Failed to decrypt existing values with oldKey; rotation aborted"
          : "Rotation failed; no changes were committed";
      res.status(500).json({ error: message });
    }
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
  "/scheduled-invoice-exports",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const [schedule] = await db
      .select()
      .from(scheduledInvoiceExportsTable)
      .orderBy(desc(scheduledInvoiceExportsTable.updatedAt))
      .limit(1);
    res.json(schedule ?? null);
  },
);

router.put(
  "/scheduled-invoice-exports",
  requireRole("owner", "partner"),
  async (req, res) => {
    const bodySchema = scheduledInvoiceExportFiltersSchema.safeParse(
      req.body?.filters,
    );
    if (!bodySchema.success) {
      res.status(400).json({
        error: "Invalid filters",
        details: bodySchema.error.issues,
      });
      return;
    }
    const enabled = req.body?.enabled !== false;

    const [existing] = await db
      .select()
      .from(scheduledInvoiceExportsTable)
      .orderBy(desc(scheduledInvoiceExportsTable.updatedAt))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(scheduledInvoiceExportsTable)
        .set({ enabled, filters: bodySchema.data })
        .where(eq(scheduledInvoiceExportsTable.id, existing.id))
        .returning();
      res.json(updated);
      return;
    }

    const [created] = await db
      .insert(scheduledInvoiceExportsTable)
      .values({
        enabled,
        filters: bodySchema.data,
        createdById: req.user?.id ?? null,
      })
      .returning();
    res.status(201).json(created);
  },
);

router.delete(
  "/scheduled-invoice-exports",
  requireRole("owner", "partner"),
  async (_req, res) => {
    await db.delete(scheduledInvoiceExportsTable);
    res.json({ message: "Scheduled invoice export disabled" });
  },
);

router.post(
  "/scheduled-invoice-exports/run-now",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const [schedule] = await db
      .select()
      .from(scheduledInvoiceExportsTable)
      .orderBy(desc(scheduledInvoiceExportsTable.updatedAt))
      .limit(1);
    if (!schedule) {
      res.status(404).json({ error: "No schedule configured" });
      return;
    }
    try {
      const run = await executeScheduledExport(schedule);
      res.status(201).json(run);
    } catch (err) {
      logger.error({ err }, "Manual scheduled export run failed");
      res.status(500).json({ error: "Failed to run export" });
    }
  },
);

router.get(
  "/invoice-export-runs",
  requireRole("owner", "partner"),
  async (_req, res) => {
    const runs = await db
      .select({
        id: invoiceExportRunsTable.id,
        scheduledExportId: invoiceExportRunsTable.scheduledExportId,
        filename: invoiceExportRunsTable.filename,
        rowCount: invoiceExportRunsTable.rowCount,
        periodStart: invoiceExportRunsTable.periodStart,
        periodEnd: invoiceExportRunsTable.periodEnd,
        createdAt: invoiceExportRunsTable.createdAt,
      })
      .from(invoiceExportRunsTable)
      .orderBy(desc(invoiceExportRunsTable.createdAt))
      .limit(50);
    res.json(runs);
  },
);

router.get(
  "/invoice-export-runs/:id/download",
  requireRole("owner", "partner"),
  async (req, res) => {
    const [run] = await db
      .select()
      .from(invoiceExportRunsTable)
      .where(eq(invoiceExportRunsTable.id, req.params.id))
      .limit(1);
    if (!run) {
      res.status(404).json({ error: "Export not found" });
      return;
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${run.filename}"`,
    );
    res.send(run.csv);
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

router.post(
  "/invoices/:id/email-payment-link",
  requireProjectAccessViaEntity(resolveProjectFromInvoice, "id"),
  async (req, res) => {
    try {
      const [invoice] = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.id, req.params.id))
        .limit(1);

      if (!invoice) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }
      if (invoice.status !== "sent" && invoice.status !== "overdue") {
        res
          .status(400)
          .json({ error: "Payment links can only be emailed for sent or overdue invoices" });
        return;
      }

      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, invoice.projectId))
        .limit(1);

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      let recipientEmail: string | null = null;
      let recipientName: string | null = null;

      if (project.clientId) {
        const [clientUser] = await db
          .select({ email: usersTable.email, name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, project.clientId))
          .limit(1);
        if (clientUser?.email) {
          recipientEmail = clientUser.email;
          recipientName = clientUser.name ?? null;
        }
      }

      if (!recipientEmail && project.organizationId) {
        const [org] = await db
          .select({
            contactEmail: organizationsTable.contactEmail,
            contactName: organizationsTable.contactName,
          })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, project.organizationId))
          .limit(1);
        if (org?.contactEmail) {
          recipientEmail = org.contactEmail;
          recipientName = org.contactName ?? null;
        }
      }

      if (!recipientEmail) {
        res.status(400).json({
          error: "No client contact email is set for this project",
        });
        return;
      }

      const baseUrl = `${getAppBaseUrl()}/client/billing`;
      const successUrl = `${baseUrl}?payment=success`;
      const cancelUrl = `${baseUrl}?payment=canceled`;

      const session = await stripeService.createCheckoutSession(
        invoice.id,
        successUrl,
        cancelUrl,
      );

      if (!session) {
        res.status(400).json({
          error:
            "Could not create a Stripe Checkout link. Make sure Stripe is connected and the invoice is unpaid.",
        });
        return;
      }

      const dueDateLabel = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : null;

      const html = renderPaymentLinkEmail({
        recipientName,
        projectName: project.name,
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description,
        amountUsd: invoice.amount,
        dueDateLabel,
        link: session.url,
      });

      const subject = invoice.invoiceNumber
        ? `Payment link for ${invoice.invoiceNumber} – ${project.name}`
        : `Payment link for ${project.name}`;

      await sendEmail({
        to: recipientEmail,
        subject,
        text: `Hi ${recipientName ?? "there"},\n\nHere is your secure Stripe payment link for ${project.name}${invoice.invoiceNumber ? ` (${invoice.invoiceNumber})` : ""}: ${session.url}\n\nAmount: $${invoice.amount.toLocaleString("en-US")}\nFor: ${invoice.description}${dueDateLabel ? `\nDue: ${dueDateLabel}` : ""}\n\nThanks,\nPGTSND Productions`,
        html,
      });

      const [updated] = await db
        .update(invoicesTable)
        .set({
          paymentLinkSentAt: new Date(),
          paymentLinkSentTo: recipientEmail,
        })
        .where(eq(invoicesTable.id, invoice.id))
        .returning();

      validateAndSend(res, selectInvoiceSchema, updated);
    } catch (err) {
      logger.error({ err }, "Email payment link failed");
      res.status(500).json({ error: "Failed to email payment link" });
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
  "/integrations/drive/folders",
  requireRole("owner", "partner"),
  async (req, res) => {
    const parentId = (req.query.parentId as string) || undefined;
    const folders = await driveService.listFolders(parentId);
    res.json(folders);
  },
);

router.get(
  "/integrations/drive/folders/search",
  requireRole("owner", "partner"),
  async (req, res) => {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      res.json([]);
      return;
    }
    const results = await driveService.searchFolders(q);
    res.json(results);
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
