import { useCallback, useEffect, useRef, useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useToast } from "../components/Toast";
import { csrfHeaders } from "../lib/csrf";

type MediaUpload = {
  id: string;
  objectPath: string;
  name: string;
  label: string | null;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
};

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

export default function TeamUploads() {
  const { t } = useTheme();
  const { toast } = useToast();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const [items, setItems] = useState<MediaUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [activeUpload, setActiveUpload] = useState<{ name: string; progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!okType && !okExt) return "Unsupported file type.";
    if (file.size <= 0 || file.size > MAX_BYTES) return "File must be between 1 byte and 2 GB.";
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast(validationError, "error");
      return;
    }
    setError(null);
    setActiveUpload({ name: file.name, progress: 5 });
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

      setActiveUpload({ name: file.name, progress: 10 });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 10 + Math.round((e.loaded / e.total) * 85);
            setActiveUpload({ name: file.name, progress: pct });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setActiveUpload({ name: file.name, progress: 97 });
      const regRes = await fetch("/api/storage/media", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          objectPath,
          name: file.name,
          contentType,
          sizeBytes: file.size,
        }),
      });
      if (!regRes.ok) throw new Error("Failed to register upload");

      toast("Upload complete.", "success");
      await fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setActiveUpload(null);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (activeUpload) return;
    const files = e.dataTransfer?.files;
    if (files && files.length) void uploadFiles(files);
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

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={f({ fontWeight: 700, fontSize: "28px", color: t.text, marginBottom: "8px" })}>
            Uploads
          </h1>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textTertiary })}>
            Drag-drop large videos and other site assets here. Files upload directly to App Storage
            and get a stable URL you can paste into any page.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!activeUpload) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !activeUpload && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? t.accent : t.border}`,
            borderRadius: "12px",
            padding: "48px 32px",
            background: dragOver ? "rgba(255,255,255,0.03)" : "transparent",
            textAlign: "center",
            cursor: activeUpload ? "wait" : "pointer",
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
              if (files && files.length) void uploadFiles(files);
              e.target.value = "";
            }}
            data-testid="uploads-file-input"
          />
          {activeUpload ? (
            <div>
              <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "12px" })}>
                Uploading {activeUpload.name}…
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
                Drop files here or click to choose
              </p>
              <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textTertiary })}>
                MP4, WebM, MOV, JPG, PNG, WebP, GIF, PDF — up to 2 GB each
              </p>
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
          {loading ? "Loading…" : `${items.length} file${items.length === 1 ? "" : "s"}`}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => {
            const url = `/api/storage${item.objectPath}`;
            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto auto",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
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
                    maxWidth: "320px",
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
