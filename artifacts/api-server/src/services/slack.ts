import { db, integrationSettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export interface SlackMessage {
  ts: string;
  text: string;
  user: string;
  channel: string;
  threadTs?: string;
}

interface SlackConfig {
  botToken: string;
  defaultChannelId?: string;
}

async function getSlackConfig(): Promise<SlackConfig | null> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(
      and(
        eq(integrationSettingsTable.type, "slack"),
        eq(integrationSettingsTable.enabled, true),
      ),
    )
    .limit(1);

  if (!settings?.config?.botToken) return null;
  return settings.config as unknown as SlackConfig;
}

export async function isSlackConnected(): Promise<boolean> {
  const config = await getSlackConfig();
  return config !== null;
}

async function slackApi(method: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const config = await getSlackConfig();
  if (!config) throw new Error("Slack not connected");

  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { ok: boolean; error?: string };
  if (!data.ok) {
    console.error(`Slack API error (${method}):`, data.error);
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

export async function sendMessage(channelId: string, text: string, threadTs?: string): Promise<SlackMessage | null> {
  const config = await getSlackConfig();
  if (!config) return null;

  try {
    const payload: Record<string, unknown> = {
      channel: channelId,
      text,
    };
    if (threadTs) payload.thread_ts = threadTs;

    const data = await slackApi("chat.postMessage", payload) as {
      message: SlackMessage;
    };
    return data.message;
  } catch (err) {
    console.error("Slack send message error:", err);
    return null;
  }
}

export async function getChannelHistory(channelId: string, limit = 50): Promise<SlackMessage[]> {
  const config = await getSlackConfig();
  if (!config) return [];

  try {
    const data = await slackApi("conversations.history", {
      channel: channelId,
      limit,
    }) as { messages: SlackMessage[] };
    return data.messages || [];
  } catch (err) {
    console.error("Slack get history error:", err);
    return [];
  }
}

export async function listChannels(): Promise<{ id: string; name: string }[]> {
  const config = await getSlackConfig();
  if (!config) return [];

  try {
    const data = await slackApi("conversations.list", {
      types: "public_channel,private_channel",
      limit: 200,
    }) as { channels: { id: string; name: string }[] };
    return data.channels || [];
  } catch (err) {
    console.error("Slack list channels error:", err);
    return [];
  }
}

export async function createChannel(name: string): Promise<{ id: string; name: string } | null> {
  const config = await getSlackConfig();
  if (!config) return null;

  try {
    const data = await slackApi("conversations.create", {
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      is_private: false,
    }) as { channel: { id: string; name: string } };
    return data.channel;
  } catch (err) {
    console.error("Slack create channel error:", err);
    return null;
  }
}
