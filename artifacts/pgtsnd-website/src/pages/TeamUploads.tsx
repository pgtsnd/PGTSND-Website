import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useToast } from "../components/Toast";
import { csrfHeaders } from "../lib/csrf";

type MediaUpload = {
  id: string;
  objectPath: string;
  name: string;
  label: string | null;
  folder: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
};

type FileWithFolder = { file: File; folderHint?: string };

const ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const ACCEPTED_EXTS = [".mp4", ".webm", ".mov", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function inferContentType(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function sanitizeFolderName(input: string): string {
  return (input || "site").trim().slice(0, 200).replace(/[^a-zA-Z0-9 _\-./]/g, "") || "site";
}

// Recursively walk a webkit FileSystemEntry and collect File objects with their
// folder path (the first path segment becomes the folder hint).
async function readEntries(
  entry: any,
  pathPrefix: string,
): Promise<FileWithFolder[]> {
  if (entry.isFile) {
    const file: File = await new Promise((resolve, reject) =>
      entry.file(resolve, reject),
    );
    return [{ file, folderHint: pathPrefix.split("/")[0] || undefined }];
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const all: FileWithFolder[] = [];
    // readEntries returns at most ~100 entries per call; loop until empty.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch: any[] = await new Promise((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (!batch.length) break;
      for (const child of batch) {
        const childPath = pathPrefix ? `${pathPrefix}/${child.name}` : child.name;
        const sub = await readEntries(child, childPath);
        all.push(...sub);
      }
    }
    return all;
  }
  return [];
}

export default function TeamUploads() {
  const { t } = useTheme();
  const { toast } = useToast();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const [items, setItems] = useState<MediaUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [activeUpload, setActiveUpload] = useState<{
    name: string;
    progress: number;
    index: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>("site uploads");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/storage/media", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load uploads");
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load uploads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const validateFile = (file: File): string | null => {
    const ct = inferContentType(file);
    const lower = file.name.toLowerCase();
    const okType = ACCEPTED_TYPES.includes(ct);
    const okExt = ACCEPTED_EXTS.some((ext) => lower.endsWith(ext));
    if (!okType && !okExt) return `Skipped: ${file.name} (unsupported type)`;
    if (file.size <= 0 || file.size > MAX_BYTES) return `Skipped: ${file.name} (size out of range)`;
    return null;
  };

  const uploadOne = async (
    file: File,
    folderForFile: string,
    index: number,
    total: number,
  ): Promise<boolean> => {
    setActiveUpload({ name: file.name, progress: 5, index, total });
    const contentType = inferContentType(file);
    try {
      const reqRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ name: file.name, size: file.size, contentType }),
      });
      if (!reqRes.ok) {
        const data = await reqRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start upload");
      }
      const { uploadURL, objectPath } = (await reqRes.json()) as {
        uploadURL: string;
        objectPath: string;
      };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 10 + Math.round((e.loaded / e.total) * 85);
            setActiveUpload({ name: file.name, progress: pct, index, total });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setActiveUpload({ name: file.name, progress: 97, index, total });
      const regRes = await fetch("/api/storage/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          objectPath,
          name: file.name,
          contentType,
          sizeBytes: file.size,
          folder: folderForFile,
        }),
      });
      if (!regRes.ok) throw new Error("Failed to register upload");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast(`${file.name}: ${msg}`, "error");
      return false;
    }
  };

  const uploadBatch = async (files: FileWithFolder[]) => {
    if (!files.length) return;
    setError(null);
    const valid: FileWithFolder[] = [];
    const skipped: string[] = [];
    for (const item of files) {
      const v = validateFile(item.file);
      if (v) skipped.push(v);
      else valid.push(item);
    }
    if (skipped.length) {
      setError(skipped.slice(0, 4).join(" · ") + (skipped.length > 4 ? ` (+${skipped.length - 4} more)` : ""));
    }
    let okCount = 0;
    for (let i = 0; i < valid.length; i += 1) {
      const item = valid[i];
      const folderForFile = sanitizeFolderName(item.folderHint || folderName);
      // eslint-disable-next-line no-await-in-loop
      const ok = await uploadOne(item.file, folderForFile, i + 1, valid.length);
      if (ok) okCount += 1;
    }
    setActiveUpload(null);
    if (okCount > 0) toast(`${okCount} of ${valid.length} uploaded.`, "success");
    await fetchList();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (activeUpload) return;
    const items = e.dataTransfer?.items;
    const collected: FileWithFolder[] = [];
    if (items && items.length && typeof (items[0] as any).webkitGetAsEntry === "function") {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i += 1) {
        const entry = (items[i] as any).webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }
      for (const entry of entries) {
        // eslint-disable-next-line no-await-in-loop
        const sub = await readEntries(entry, entry.isDirectory ? entry.name : "");
        collected.push(...sub);
      }
    } else {
      const files = e.dataTransfer?.files;
      if (files) for (let i = 0; i < files.length; i += 1) collected.push({ file: files[i] });
    }
    void uploadBatch(collected);
  };

  const handleFilePick = (files: FileList) => {
    const list: FileWithFolder[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const rel = (file as any).webkitRelativePath as string | undefined;
      const folderHint = rel ? rel.split("/")[0] : undefined;
      list.push({ file, folderHint });
    }
    void uploadBatch(list);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this upload from the list? (The file stays in storage.)")) return;
    const res = await fetch(`/api/storage/media/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: csrfHeaders(),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast("Removed.", "success");
    } else {
      toast("Failed to remove.", "error");
    }
  };

  const copyUrl = (item: MediaUpload) => {
    const url = `/api/storage${item.objectPath}`;
    const absolute = `${window.location.origin}${url}`;
    navigator.clipboard
      .writeText(absolute)
      .then(() => {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 1500);
      })
      .catch(() => toast("Could not copy.", "error"));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MediaUpload[]>();
    for (const it of items) {
      const key = it.folder || "site";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={f({ fontWeight: 700, fontSize: "28px", color: t.text, marginBottom: "8px" })}>
            Uploads
          </h1>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textTertiary })}>
            Drag-drop files or whole folders here. Files upload directly to App Storage and get a
            stable URL. Use folders to keep site assets separate from project work.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <label style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>
            Folder:
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="site uploads"
            style={f({
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 500,
              background: t.bgInput,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              minWidth: "220px",
            })}
            data-testid="uploads-folder-input"
          />
          <span style={f({ fontWeight: 400, fontSize: "12px", color: t.textTertiary })}>
            New uploads go into this folder. Drop a folder to use its name automatically.
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!activeUpload) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? t.accent : t.border}`,
            borderRadius: "12px",
            padding: "48px 32px",
            background: dragOver ? "rgba(255,255,255,0.03)" : "transparent",
            textAlign: "center",
            transition: "all 0.15s ease",
            marginBottom: "32px",
          }}
          data-testid="uploads-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTS.join(",")}
            style={{ display: "none" }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length) handleFilePick(files);
              e.target.value = "";
            }}
            data-testid="uploads-file-input"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error - non-standard but widely supported
            webkitdirectory=""
            directory=""
            style={{ display: "none" }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length) handleFilePick(files);
              e.target.value = "";
            }}
            data-testid="uploads-folder-input-picker"
          />
          {activeUpload ? (
            <div>
              <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "12px" })}>
                Uploading {activeUpload.name}…{" "}
                <span style={{ color: t.textTertiary, fontWeight: 500 }}>
                  ({activeUpload.index} of {activeUpload.total})
                </span>
              </p>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: t.border,
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${activeUpload.progress}%`,
                    height: "100%",
                    background: t.accent,
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textTertiary, marginTop: "8px" })}>
                {activeUpload.progress}%
              </p>
            </div>
          ) : (
            <>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.textMuted}
                strokeWidth="1.5"
                style={{ marginBottom: "16px" }}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={f({ fontWeight: 600, fontSize: "16px", color: t.text, marginBottom: "6px" })}>
                Drop files or a whole folder here
              </p>
              <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textTertiary, marginBottom: "16px" })}>
                MP4, WebM, MOV, JPG, PNG, WebP, GIF, PDF — up to 2 GB each
              </p>
              <div style={{ display: "inline-flex", gap: "8px" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={f({
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: t.accent,
                    color: t.accentText,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  })}
                  data-testid="uploads-choose-files-btn"
                >
                  Choose files
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  style={f({
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "transparent",
                    color: t.text,
                    border: `1px solid ${t.border}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                  })}
                  data-testid="uploads-choose-folder-btn"
                >
                  Choose folder
                </button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 90, 90, 0.1)",
              border: "1px solid rgba(255, 90, 90, 0.3)",
              color: "#ff6b6b",
              marginBottom: "24px",
              ...f({ fontWeight: 500, fontSize: "13px" }),
            }}
          >
            {error}
          </div>
        )}

        <h2 style={f({ fontWeight: 600, fontSize: "16px", color: t.text, marginBottom: "16px" })}>
          {loading ? "Loading…" : `${items.length} file${items.length === 1 ? "" : "s"} in ${grouped.length} folder${grouped.length === 1 ? "" : "s"}`}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {grouped.map(([folder, rows]) => {
            const isCollapsed = collapsed[folder] === true;
            return (
              <div key={folder} data-testid={`upload-folder-${folder}`}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [folder]: !isCollapsed }))}
                  style={f({
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 12px",
                    background: t.bgElevated,
                    border: `1px solid ${t.border}`,
                    borderRadius: "8px",
                    color: t.text,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                    textAlign: "left" as const,
                    marginBottom: "8px",
                  })}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>{folder}</span>
                  <span style={{ color: t.textTertiary, fontWeight: 500, fontSize: "12px" }}>
                    {rows.length} file{rows.length === 1 ? "" : "s"}
                  </span>
                </button>
                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
                    {rows.map((item) => {
                      const url = `/api/storage${item.objectPath}`;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto auto auto auto",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 14px",
                            border: `1px solid ${t.border}`,
                            borderRadius: "8px",
                            background: t.bgCard,
                          }}
                          data-testid={`upload-row-${item.id}`}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={f({
                                fontWeight: 600,
                                fontSize: "13px",
                                color: t.text,
                                marginBottom: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              })}
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary })}>
                              {item.contentType} · {formatSize(item.sizeBytes)} ·{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <code
                            style={f({
                              fontFamily: "monospace" as const,
                              fontSize: "11px",
                              color: t.textTertiary,
                              background: t.bgInput,
                              padding: "4px 8px",
                              borderRadius: "4px",
                              maxWidth: "260px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            })}
                            title={url}
                          >
                            {url}
                          </code>
                          <button
                            onClick={() => copyUrl(item)}
                            style={f({
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: `1px solid ${t.border}`,
                              borderRadius: "6px",
                              background: copiedId === item.id ? t.accent : "transparent",
                              color: copiedId === item.id ? t.accentText : t.text,
                              cursor: "pointer",
                            })}
                            data-testid={`upload-copy-${item.id}`}
                          >
                            {copiedId === item.id ? "Copied" : "Copy URL"}
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={f({
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: `1px solid ${t.border}`,
                              borderRadius: "6px",
                              color: t.text,
                              textDecoration: "none",
                            })}
                            data-testid={`upload-open-${item.id}`}
                          >
                            Open
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={f({
                              padding: "8px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: `1px solid ${t.border}`,
                              borderRadius: "6px",
                              background: "transparent",
                              color: "#ff6b6b",
                              cursor: "pointer",
                            })}
                            data-testid={`upload-delete-${item.id}`}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && items.length === 0 && (
            <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textTertiary, padding: "16px" })}>
              No uploads yet.
            </p>
          )}
        </div>
      </div>
    </TeamLayout>
  );
}
