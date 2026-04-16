import Stripe from "stripe";
import { db, integrationSettingsTable, invoicesTable, type Invoice } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decryptConfig, isVaultReady } from "./vault";

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

  if (!settings?.config) return null;

  const config = isVaultReady() ? decryptConfig(settings.config) : settings.config;
  if (!config.secretKey) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(config.secretKey, {
      apiVersion: "2026-03-25.dahlia",
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

export async function createCheckoutSession(
  invoiceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string } | null> {
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId))
    .limit(1);

  if (!invoice) return null;
  if (invoice.status === "paid" || invoice.status === "void") return null;

  const stripe = await getStripeClient();
  if (!stripe) return null;

  if (invoice.stripeCheckoutSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(invoice.stripeCheckoutSessionId);
      if (existing.status === "open") {
        return { url: existing.url! };
      }
    } catch {
      // session expired or invalid, create a new one
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: invoice.description,
            metadata: {
              invoiceNumber: invoice.invoiceNumber ?? "",
              invoiceId: invoice.id,
            },
          },
          unit_amount: invoice.amount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? "",
    },
    payment_intent_data: {
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? "",
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  await db
    .update(invoicesTable)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(invoicesTable.id, invoiceId));

  return { url: session.url! };
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

export async function handleStripeWebhook(payload: string | Buffer, signature: string): Promise<void> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(eq(integrationSettingsTable.type, "stripe"))
    .limit(1);

  if (!settings?.config) return;

  const config = isVaultReady() ? decryptConfig(settings.config) : settings.config;
  if (!config.webhookSecret || !config.secretKey) return;

  const stripe = new Stripe(config.secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    throw new Error("Invalid webhook signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (!invoiceId) break;

      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

      let paymentMethod = "card";
      if (paymentIntentId && stripe) {
        try {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ["payment_method"],
          });
          const pm = pi.payment_method;
          if (typeof pm === "object" && pm !== null && "type" in pm) {
            paymentMethod = pm.type === "card" && "card" in pm && pm.card
              ? `${pm.card.brand ?? "card"} ····${pm.card.last4 ?? ""}`
              : pm.type;
          }
        } catch {
          // fall back to "card"
        }
      }

      await db
        .update(invoicesTable)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentMethod,
          stripePaymentIntentId: paymentIntentId ?? null,
        })
        .where(eq(invoicesTable.id, invoiceId));
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoiceId;

      if (invoiceId) {
        const [existing] = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.id, invoiceId))
          .limit(1);

        if (existing && existing.status !== "paid") {
          let paymentMethod = "card";
          try {
            const pmId = typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method?.id;
            if (pmId) {
              const pm = await stripe.paymentMethods.retrieve(pmId);
              if (pm.type === "card" && pm.card) {
                paymentMethod = `${pm.card.brand ?? "card"} ····${pm.card.last4 ?? ""}`;
              }
            }
          } catch {
            // fall back to "card"
          }

          await db
            .update(invoicesTable)
            .set({
              status: "paid",
              paidAt: new Date(),
              paymentMethod,
              stripePaymentIntentId: paymentIntent.id,
            })
            .where(eq(invoicesTable.id, invoiceId));
        }
      }
      break;
    }

    case "invoice.paid": {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      await db
        .update(invoicesTable)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentMethod: "card",
        })
        .where(eq(invoicesTable.stripeInvoiceId, stripeInvoice.id));
      break;
    }

    case "invoice.payment_failed": {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      await db
        .update(invoicesTable)
        .set({ status: "overdue" })
        .where(eq(invoicesTable.stripeInvoiceId, stripeInvoice.id));
      break;
    }

    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      const failedInvoiceId = failedIntent.metadata?.invoiceId;
      if (failedInvoiceId) {
        const [existing] = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.id, failedInvoiceId))
          .limit(1);

        if (existing && existing.status !== "paid") {
          await db
            .update(invoicesTable)
            .set({ status: "overdue" })
            .where(eq(invoicesTable.id, failedInvoiceId));
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        const [existing] = await db
          .select()
          .from(invoicesTable)
          .where(eq(invoicesTable.id, invoiceId))
          .limit(1);

        if (existing && existing.status !== "paid") {
          await db
            .update(invoicesTable)
            .set({ stripeCheckoutSessionId: null })
            .where(eq(invoicesTable.id, invoiceId));
        }
      }
      break;
    }
  }
}

export async function getPaymentDetails(invoiceId: string): Promise<{
  paymentIntentId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
} | null> {
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, invoiceId))
    .limit(1);

  if (!invoice || !invoice.stripePaymentIntentId) return null;

  const stripe = await getStripeClient();
  if (!stripe) return null;

  try {
    const pi = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId, {
      expand: ["latest_charge"],
    });

    let receiptUrl: string | null = null;
    const charge = pi.latest_charge;
    if (typeof charge === "object" && charge !== null && "receipt_url" in charge) {
      receiptUrl = charge.receipt_url ?? null;
    }

    return {
      paymentIntentId: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: pi.status,
      paymentMethod: invoice.paymentMethod,
      receiptUrl,
      paidAt: invoice.paidAt?.toISOString() ?? null,
    };
  } catch (err) {
    console.error("Failed to retrieve payment details:", err);
    return null;
  }
}

export async function listInvoicesByProject(projectId: string): Promise<Invoice[]> {
  return db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.projectId, projectId));
}
