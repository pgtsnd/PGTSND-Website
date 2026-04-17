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

export async function listFolders(parentId?: string): Promise<DriveFile[]> {
  const config = await getDriveConfig();
  if (!config) return [];

  try {
    const parent = parentId || "root";
    const query = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const fields = "files(id,name,mimeType,modifiedTime,webViewLink,parents)";
    const res = await driveRequest(
      `/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name&pageSize=100`,
    );

    if (!res.ok) {
      console.error("Drive API error:", await res.text());
      return [];
    }

    const data = (await res.json()) as { files: DriveFile[] };
    return data.files || [];
  } catch (err) {
    console.error("Drive list folders error:", err);
    return [];
  }
}

export interface DriveFolderSearchResult extends DriveFile {
  parentPath: string;
}

export async function searchFolders(
  query: string,
  pageSize: number = 25,
): Promise<DriveFolderSearchResult[]> {
  const config = await getDriveConfig();
  if (!config) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const escaped = trimmed.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = `name contains '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const fields = "files(id,name,mimeType,modifiedTime,webViewLink,parents)";
    const safePageSize = Math.min(Math.max(pageSize, 1), 50);
    const res = await driveRequest(
      `/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=name&pageSize=${safePageSize}`,
    );

    if (!res.ok) {
      console.error("Drive API error:", await res.text());
      return [];
    }

    const data = (await res.json()) as { files: DriveFile[] };
    const folders = data.files || [];
    if (folders.length === 0) return [];

    const folderCache = new Map<string, DriveFile | null>();

    async function fetchFolder(id: string): Promise<DriveFile | null> {
      if (folderCache.has(id)) return folderCache.get(id) ?? null;
      try {
        const r = await driveRequest(
          `/files/${id}?fields=${encodeURIComponent("id,name,parents")}`,
        );
        if (!r.ok) {
          folderCache.set(id, null);
          return null;
        }
        const f = (await r.json()) as DriveFile;
        folderCache.set(id, f);
        return f;
      } catch {
        folderCache.set(id, null);
        return null;
      }
    }

    async function buildPath(parentId: string | undefined): Promise<string> {
      if (!parentId) return "My Drive";
      const segments: string[] = [];
      let current: string | undefined = parentId;
      const guard = new Set<string>();
      while (current && !guard.has(current) && segments.length < 8) {
        guard.add(current);
        const f = await fetchFolder(current);
        if (!f) break;
        segments.unshift(f.name);
        current = f.parents?.[0];
      }
      return ["My Drive", ...segments].join(" / ");
    }

    const results: DriveFolderSearchResult[] = [];
    for (const folder of folders) {
      const parentPath = await buildPath(folder.parents?.[0]);
      results.push({ ...folder, parentPath });
    }
    return results;
  } catch (err) {
    console.error("Drive search folders error:", err);
    return [];
  }
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
