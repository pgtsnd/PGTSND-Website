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

interface CachedFolder {
  folder: DriveFile | null;
  expires: number;
}

const FOLDER_CACHE_TTL_MS = 5 * 60 * 1000;
const FOLDER_NEGATIVE_CACHE_TTL_MS = 30 * 1000;
const FOLDER_CACHE_MAX = 5000;
const folderCache = new Map<string, CachedFolder>();
const inflightFolderLookups = new Map<string, Promise<DriveFile | null>>();

function getCachedFolder(id: string): DriveFile | null | undefined {
  const entry = folderCache.get(id);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    folderCache.delete(id);
    return undefined;
  }
  return entry.folder;
}

function setCachedFolder(id: string, folder: DriveFile | null): void {
  if (folderCache.size >= FOLDER_CACHE_MAX) {
    const firstKey = folderCache.keys().next().value;
    if (firstKey !== undefined) folderCache.delete(firstKey);
  }
  const ttl = folder === null ? FOLDER_NEGATIVE_CACHE_TTL_MS : FOLDER_CACHE_TTL_MS;
  folderCache.set(id, { folder, expires: Date.now() + ttl });
}

export function _clearDriveFolderCache(): void {
  folderCache.clear();
  inflightFolderLookups.clear();
}

async function fetchFolderMeta(id: string): Promise<DriveFile | null> {
  const cached = getCachedFolder(id);
  if (cached !== undefined) return cached;

  const inflight = inflightFolderLookups.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const r = await driveRequest(
        `/files/${id}?fields=${encodeURIComponent("id,name,parents")}`,
      );
      if (!r.ok) {
        setCachedFolder(id, null);
        return null;
      }
      const f = (await r.json()) as DriveFile;
      setCachedFolder(id, f);
      return f;
    } catch {
      setCachedFolder(id, null);
      return null;
    } finally {
      inflightFolderLookups.delete(id);
    }
  })();

  inflightFolderLookups.set(id, promise);
  return promise;
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

    const MAX_DEPTH = 8;
    const visited = new Set<string>();

    let frontier = new Set<string>();
    for (const folder of folders) {
      const p = folder.parents?.[0];
      if (p) frontier.add(p);
    }

    for (let depth = 0; depth < MAX_DEPTH && frontier.size > 0; depth++) {
      const ids = Array.from(frontier).filter((id) => !visited.has(id));
      if (ids.length === 0) break;
      ids.forEach((id) => visited.add(id));

      const fetched = await Promise.all(ids.map((id) => fetchFolderMeta(id)));
      const next = new Set<string>();
      for (const f of fetched) {
        const parent = f?.parents?.[0];
        if (parent && !visited.has(parent)) next.add(parent);
      }
      frontier = next;
    }

    function buildPath(parentId: string | undefined): string {
      if (!parentId) return "My Drive";
      const segments: string[] = [];
      const seen = new Set<string>();
      let current: string | undefined = parentId;
      while (current && !seen.has(current) && segments.length < MAX_DEPTH) {
        seen.add(current);
        const cached = getCachedFolder(current);
        if (cached === undefined || cached === null) break;
        segments.unshift(cached.name);
        current = cached.parents?.[0];
      }
      return ["My Drive", ...segments].join(" / ");
    }

    return folders.map((folder) => ({
      ...folder,
      parentPath: buildPath(folder.parents?.[0]),
    }));
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
