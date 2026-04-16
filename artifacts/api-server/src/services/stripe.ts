import Stripe from "stripe";
import { db, integrationSettingsTable, invoicesTable, type Invoice } from "@workspace/db";
import { eq, and } from "drizzle-orm";

let stripeClient: Stripe | null = null;

async function getStripeClient(): Promise<Stripe | null> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(
      and(
        eq(integrationSettingsTable.type, "stripe"),
        eq(integrationSettingsTable.enabled, true),
      ),
    )
    .limit(1);

  if (!settings?.config?.secretKey) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(settings.config.secretKey, {
      apiVersion: "2025-04-30.basil",
    });
  }

  return stripeClient;
}

export function resetStripeClient() {
  stripeClient = null;
}

export async function isStripeConnected(): Promise<boolean> {
  const client = await getStripeClient();
  return client !== null;
}

export async function createInvoice(data: {
  projectId: string;
  description: string;
  amount: number;
  dueDate?: Date;
  customerEmail?: string;
}): Promise<Invoice> {
  const stripe = await getStripeClient();

  let stripeInvoiceId: string | undefined;
  let stripeHostedUrl: string | undefined;
  let stripePdfUrl: string | undefined;

  if (stripe && data.customerEmail) {
    try {
      const customers = await stripe.customers.list({ email: data.customerEmail, limit: 1 });
      let customerId = customers.data[0]?.id;

      if (!customerId) {
        const customer = await stripe.customers.create({ email: data.customerEmail });
        customerId = customer.id;
      }

      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: 14,
      });

      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: data.amount * 100,
        currency: "usd",
        description: data.description,
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      stripeInvoiceId = finalizedInvoice.id;
      stripeHostedUrl = finalizedInvoice.hosted_invoice_url ?? undefined;
      stripePdfUrl = finalizedInvoice.invoice_pdf ?? undefined;
    } catch (err) {
      console.error("Stripe invoice creation failed:", err);
    }
  }

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      projectId: data.projectId,
      description: data.description,
      amount: data.amount,
      status: stripeInvoiceId ? "sent" : "draft",
      dueDate: data.dueDate ?? null,
      invoiceNumber,
      stripeInvoiceId: stripeInvoiceId ?? null,
      stripeHostedUrl: stripeHostedUrl ?? null,
      stripePdfUrl: stripePdfUrl ?? null,
    })
    .returning();

  return invoice;
}

export async function sendInvoice(invoiceId: string): Promise<Invoice | null> {
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId))
    .limit(1);

  if (!invoice) return null;

  const stripe = await getStripeClient();

  if (stripe && invoice.stripeInvoiceId) {
    try {
      await stripe.invoices.sendInvoice(invoice.stripeInvoiceId);
    } catch (err) {
      console.error("Stripe send invoice failed:", err);
    }
  }

  const [updated] = await db
    .update(invoicesTable)
    .set({ status: "sent" })
    .where(eq(invoicesTable.id, invoiceId))
    .returning();

  return updated;
}

export async function handleStripeWebhook(payload: string, signature: string): Promise<void> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(eq(integrationSettingsTable.type, "stripe"))
    .limit(1);

  if (!settings?.config?.webhookSecret || !settings?.config?.secretKey) return;

  const stripe = new Stripe(settings.config.secretKey, {
    apiVersion: "2025-04-30.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, settings.config.webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    throw new Error("Invalid webhook signature");
  }

  if (event.type === "invoice.paid") {
    const stripeInvoice = event.data.object as Stripe.Invoice;
    await db
      .update(invoicesTable)
      .set({
        status: "paid",
        paidAt: new Date(),
        paymentMethod: stripeInvoice.charge ? "card" : "unknown",
      })
      .where(eq(invoicesTable.stripeInvoiceId, stripeInvoice.id));
  }

  if (event.type === "invoice.payment_failed") {
    const stripeInvoice = event.data.object as Stripe.Invoice;
    await db
      .update(invoicesTable)
      .set({ status: "overdue" })
      .where(eq(invoicesTable.stripeInvoiceId, stripeInvoice.id));
  }
}

export async function listInvoicesByProject(projectId: string): Promise<Invoice[]> {
  return db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.projectId, projectId));
}
