import { db, integrationSettingsTable, contractsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decryptConfig, isVaultReady } from "./vault";

interface DocuSignConfig {
  accessToken: string;
  accountId: string;
  basePath?: string;
}

async function getDocuSignConfig(): Promise<DocuSignConfig | null> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(
      and(
        eq(integrationSettingsTable.type, "docusign"),
        eq(integrationSettingsTable.enabled, true),
      ),
    )
    .limit(1);

  if (!settings?.config) return null;
  const config = isVaultReady() ? decryptConfig(settings.config) : settings.config;
  if (!config.accessToken || !config.accountId) return null;
  return {
    accessToken: config.accessToken,
    accountId: config.accountId,
    basePath: config.basePath || "https://demo.docusign.net/restapi",
  };
}

export async function isDocuSignConnected(): Promise<boolean> {
  const config = await getDocuSignConfig();
  return config !== null;
}

async function docuSignRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const config = await getDocuSignConfig();
  if (!config) throw new Error("DocuSign not connected");

  const url = `${config.basePath}/v2.1/accounts/${config.accountId}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function sendEnvelope(data: {
  contractId: string;
  documentBase64: string;
  documentName: string;
  signerEmail: string;
  signerName: string;
  subject: string;
}): Promise<{ envelopeId: string } | null> {
  const config = await getDocuSignConfig();
  if (!config) return null;

  try {
    const envelope = {
      emailSubject: data.subject,
      documents: [
        {
          documentBase64: data.documentBase64,
          name: data.documentName,
          fileExtension: "pdf",
          documentId: "1",
        },
      ],
      recipients: {
        signers: [
          {
            email: data.signerEmail,
            name: data.signerName,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  anchorString: "/sn1/",
                  anchorUnits: "pixels",
                  anchorXOffset: "10",
                  anchorYOffset: "10",
                },
              ],
            },
          },
        ],
      },
      status: "sent",
    };

    const res = await docuSignRequest("/envelopes", {
      method: "POST",
      body: JSON.stringify(envelope),
    });

    if (!res.ok) {
      console.error("DocuSign envelope creation error:", await res.text());
      return null;
    }

    const result = await res.json() as { envelopeId: string };

    await db
      .update(contractsTable)
      .set({
        docusignEnvelopeId: result.envelopeId,
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(contractsTable.id, data.contractId));

    return { envelopeId: result.envelopeId };
  } catch (err) {
    console.error("DocuSign send envelope error:", err);
    return null;
  }
}

export async function getSigningUrl(contractId: string, returnUrl: string): Promise<string | null> {
  const config = await getDocuSignConfig();
  if (!config) return null;

  const [contract] = await db
    .select()
    .from(contractsTable)
    .where(eq(contractsTable.id, contractId))
    .limit(1);

  if (!contract?.docusignEnvelopeId) return null;

  try {
    const res = await docuSignRequest(
      `/envelopes/${contract.docusignEnvelopeId}/views/recipient`,
      {
        method: "POST",
        body: JSON.stringify({
          returnUrl,
          authenticationMethod: "none",
          email: "client@example.com",
          userName: "Client",
          recipientId: "1",
        }),
      },
    );

    if (!res.ok) return null;

    const data = await res.json() as { url: string };
    return data.url;
  } catch (err) {
    console.error("DocuSign signing URL error:", err);
    return null;
  }
}

export async function getEnvelopeStatus(envelopeId: string): Promise<string | null> {
  const config = await getDocuSignConfig();
  if (!config) return null;

  try {
    const res = await docuSignRequest(`/envelopes/${envelopeId}`);
    if (!res.ok) return null;

    const data = await res.json() as { status: string };
    return data.status;
  } catch (err) {
    console.error("DocuSign status error:", err);
    return null;
  }
}

export async function handleDocuSignWebhook(body: {
  event: string;
  data: { envelopeId: string };
}): Promise<void> {
  if (body.event === "envelope-completed") {
    await db
      .update(contractsTable)
      .set({
        status: "signed",
        signedAt: new Date(),
      })
      .where(eq(contractsTable.docusignEnvelopeId, body.data.envelopeId));
  }
}
