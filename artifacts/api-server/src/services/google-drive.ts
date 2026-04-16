import { db, integrationSettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { decryptConfig, isVaultReady } from "./vault";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

interface DriveConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

async function getDriveConfig(): Promise<DriveConfig | null> {
  const [settings] = await db
    .select()
    .from(integrationSettingsTable)
    .where(
      and(
        eq(integrationSettingsTable.type, "google_drive"),
        eq(integrationSettingsTable.enabled, true),
      ),
    )
    .limit(1);

  if (!settings?.config) return null;
  const config = isVaultReady() ? decryptConfig(settings.config) : settings.config;
  if (!config.accessToken) return null;
  return config as unknown as DriveConfig;
}

export async function isDriveConnected(): Promise<boolean> {
  const config = await getDriveConfig();
  return config !== null;
}

async function driveRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const config = await getDriveConfig();
  if (!config) throw new Error("Google Drive not connected");

  const url = `https://www.googleapis.com/drive/v3${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      ...options.headers,
    },
  });
}

export async function listFiles(folderId: string): Promise<DriveFile[]> {
  const config = await getDriveConfig();
  if (!config) return [];

  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const fields = "files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents)";
    const res = await driveRequest(
      `/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=folder,name`,
    );

    if (!res.ok) {
      console.error("Drive API error:", await res.text());
      return [];
    }

    const data = await res.json() as { files: DriveFile[] };
    return data.files || [];
  } catch (err) {
    console.error("Drive list files error:", err);
    return [];
  }
}

export async function getFileMetadata(fileId: string): Promise<DriveFile | null> {
  const config = await getDriveConfig();
  if (!config) return null;

  try {
    const fields = "id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents";
    const res = await driveRequest(`/files/${fileId}?fields=${encodeURIComponent(fields)}`);

    if (!res.ok) return null;
    return await res.json() as DriveFile;
  } catch (err) {
    console.error("Drive get file error:", err);
    return null;
  }
}

export async function getDownloadUrl(fileId: string): Promise<string | null> {
  const config = await getDriveConfig();
  if (!config) return null;

  try {
    const file = await getFileMetadata(fileId);
    return file?.webContentLink ?? null;
  } catch {
    return null;
  }
}
