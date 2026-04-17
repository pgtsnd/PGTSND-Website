import { db, integrationSettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decryptConfig, isVaultReady } from "./vault";

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

  if (!settings?.config) return null;
  const config = isVaultReady() ? decryptConfig(settings.config) : settings.config;
  if (!config.botToken) return null;
  return config as unknown as SlackConfig;
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

export interface SlackUserInfo {
  id: string;
  name: string;
  initials: string;
  imageUrl?: string;
}

const userInfoCache = new Map<string, { info: SlackUserInfo; expiresAt: number }>();
const USER_CACHE_TTL_MS = 60 * 60 * 1000;

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function getUserInfo(userId: string): Promise<SlackUserInfo | null> {
  if (!userId) return null;

  const cached = userInfoCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }

  try {
    const data = await slackApi("users.info", { user: userId }) as {
      user: {
        id: string;
        name?: string;
        real_name?: string;
        profile?: {
          real_name?: string;
          display_name?: string;
          image_192?: string;
          image_72?: string;
          image_48?: string;
        };
      };
    };
    const u = data.user;
    const displayName =
      u.profile?.real_name ||
      u.real_name ||
      u.profile?.display_name ||
      u.name ||
      userId;
    const imageUrl =
      u.profile?.image_192 ||
      u.profile?.image_72 ||
      u.profile?.image_48 ||
      undefined;
    const info: SlackUserInfo = {
      id: u.id,
      name: displayName,
      initials: computeInitials(displayName),
      imageUrl,
    };
    userInfoCache.set(userId, { info, expiresAt: Date.now() + USER_CACHE_TTL_MS });
    return info;
  } catch (err) {
    console.error("Slack get user info error:", err);
    return null;
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
