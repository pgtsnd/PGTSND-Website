import { useEffect, useMemo, useRef, useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useToast } from "../components/Toast";
import { csrfHeaders } from "../lib/csrf";

type FieldType = "text" | "textarea" | "boolean";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  default: string | boolean;
  help?: string;
}

interface TemplateInfo {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

interface TemplatePayload extends TemplateInfo {
  html: string;
}

type FieldValue = string | boolean;

const f = (s: object) => ({
  fontFamily: "'Montserrat', sans-serif" as const,
  ...s,
});

function buildQuery(values: Record<string, FieldValue>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === "boolean") {
      params.set(k, v ? "true" : "false");
    } else {
      params.set(k, v);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function defaultsFor(template: TemplateInfo): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const field of template.fields) {
    out[field.key] = field.default;
  }
  return out;
}

export default function AdminEmailPreviews() {
  const { t } = useTheme();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [valuesById, setValuesById] = useState<
    Record<string, Record<string, FieldValue>>
  >({});
  const [payload, setPayload] = useState<TemplatePayload | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [view, setView] = useState<"rendered" | "html">("rendered");
  const [testRecipient, setTestRecipient] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/email-previews", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json() as Promise<{ templates: TemplateInfo[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setTemplates(data.templates);
        const seeded: Record<string, Record<string, FieldValue>> = {};
        for (const tpl of data.templates) {
          seeded[tpl.id] = defaultsFor(tpl);
        }
        setValuesById(seeded);
        if (data.templates.length > 0) setActiveId(data.templates[0].id);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(err?.message ?? "Failed to load templates");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === activeId) ?? null,
    [templates, activeId],
  );

  const activeValues = useMemo(
    () => (activeId ? valuesById[activeId] ?? {} : {}),
    [activeId, valuesById],
  );

  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!activeId || !activeTemplate) return;
    let cancelled = false;

    const fetchPreview = () => {
      setLoadingPreview(true);
      setPreviewError(null);
      const qs = buildQuery(activeValues);
      fetch(`/api/admin/email-previews/${activeId}${qs}`, {
        credentials: "include",
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(`Request failed (${r.status})`);
          return r.json() as Promise<TemplatePayload>;
        })
        .then((data) => {
          if (cancelled) return;
          setPayload(data);
        })
        .catch((err) => {
          if (cancelled) return;
          setPreviewError(err?.message ?? "Failed to load preview");
        })
        .finally(() => {
          if (!cancelled) setLoadingPreview(false);
        });
    };

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(fetchPreview, 200);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [activeId, activeTemplate, activeValues]);

  const iframeSrcDoc = useMemo(() => payload?.html ?? "", [payload]);

  const updateField = (key: string, value: FieldValue) => {
    if (!activeId) return;
    setValuesById((prev) => ({
      ...prev,
      [activeId]: { ...(prev[activeId] ?? {}), [key]: value },
    }));
  };

  const resetToDefaults = () => {
    if (!activeId || !activeTemplate) return;
    setValuesById((prev) => ({
      ...prev,
      [activeId]: defaultsFor(activeTemplate),
    }));
  };

  const handleCopy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload.html);
      toast("HTML copied to clipboard", "success");
    } catch {
      toast("Failed to copy HTML", "error");
    }
  };

  const handleSendTest = async () => {
    if (!activeId) return;
    const recipient = testRecipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast("Enter a valid email address", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/email-previews/${activeId}/send`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrfHeaders() },
          body: JSON.stringify({ recipient }),
        },
      );
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: `Request failed (${res.status})` }));
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      toast(`Test email sent to ${recipient}`, "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to send test email",
        "error",
      );
    } finally {
      setSending(false);
    }
  };

  const handleOpenRaw = () => {
    if (!activeId) return;
    const qs = buildQuery({ ...activeValues, format: "html" });
    window.open(
      `/api/admin/email-previews/${activeId}${qs}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const inputBase = f({
    width: "100%",
    padding: "8px 10px",
    background: "transparent",
    color: t.text,
    border: `1px solid ${t.border}`,
    borderRadius: "6px",
    fontSize: "13px",
    boxSizing: "border-box" as const,
  });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1400px" }}>
        <h1
          style={f({
            fontWeight: 800,
            fontSize: "24px",
            color: t.text,
            marginBottom: "8px",
          })}
        >
          Email Previews
        </h1>
        <p
          style={f({
            fontWeight: 400,
            fontSize: "13px",
            color: t.textTertiary,
            marginBottom: "28px",
            maxWidth: "720px",
          })}
        >
          Preview each notification email with sample data. Edit the inputs
          below to test edge cases like long titles, missing optional fields,
          or unusual characters — blank fields fall back to defaults.
        </p>

        {listError && (
          <div
            style={f({
              padding: "12px 14px",
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              color: t.text,
              fontSize: "13px",
              marginBottom: "20px",
            })}
          >
            {listError}
          </div>
        )}

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <div style={{ width: "240px", flexShrink: 0 }}>
            <div
              style={f({
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: t.textTertiary,
                marginBottom: "10px",
              })}
            >
              Templates
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {templates.map((tpl) => {
                const active = tpl.id === activeId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveId(tpl.id)}
                    style={f({
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: `1px solid ${active ? t.accent : t.border}`,
                      background: active ? t.hoverBg : "transparent",
                      color: t.text,
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: active ? 600 : 500,
                    })}
                  >
                    <div>{tpl.label}</div>
                    <div
                      style={f({
                        fontSize: "11px",
                        fontWeight: 400,
                        color: t.textTertiary,
                        marginTop: "4px",
                        lineHeight: 1.4,
                      })}
                    >
                      {tpl.description}
                    </div>
                  </button>
                );
              })}
              {templates.length === 0 && !listError && (
                <div
                  style={f({
                    fontSize: "12px",
                    color: t.textTertiary,
                  })}
                >
                  Loading…
                </div>
              )}
            </div>
          </div>

          <div style={{ width: "320px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div
                style={f({
                  fontWeight: 700,
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: t.textTertiary,
                })}
              >
                Sample Data
              </div>
              <button
                onClick={resetToDefaults}
                disabled={!activeTemplate}
                style={f({
                  padding: "4px 10px",
                  background: "transparent",
                  color: t.text,
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  cursor: activeTemplate ? "pointer" : "not-allowed",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: activeTemplate ? 1 : 0.5,
                })}
              >
                Reset
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "16px",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
              }}
            >
              {activeTemplate?.fields.map((field) => {
                const v = activeValues[field.key];
                if (field.type === "boolean") {
                  return (
                    <label
                      key={field.key}
                      style={f({
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: t.text,
                        cursor: "pointer",
                      })}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(v)}
                        onChange={(e) =>
                          updateField(field.key, e.target.checked)
                        }
                      />
                      {field.label}
                    </label>
                  );
                }
                const strVal = typeof v === "string" ? v : "";
                return (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <label
                      style={f({
                        fontSize: "11px",
                        fontWeight: 600,
                        color: t.textTertiary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      })}
                    >
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={strVal}
                        onChange={(e) =>
                          updateField(field.key, e.target.value)
                        }
                        rows={4}
                        style={{ ...inputBase, resize: "vertical" }}
                        placeholder={
                          typeof field.default === "string"
                            ? field.default
                            : ""
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        value={strVal}
                        onChange={(e) =>
                          updateField(field.key, e.target.value)
                        }
                        style={inputBase}
                        placeholder={
                          typeof field.default === "string"
                            ? field.default
                            : ""
                        }
                      />
                    )}
                  </div>
                );
              })}
              {!activeTemplate && (
                <div
                  style={f({ fontSize: "12px", color: t.textTertiary })}
                >
                  Select a template to edit its sample data.
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                {(["rendered", "html"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={f({
                      padding: "8px 14px",
                      background: view === v ? t.accent : "transparent",
                      color: view === v ? t.accentText : t.text,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    })}
                  >
                    {v === "rendered" ? "Rendered" : "Raw HTML"}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                disabled={!payload}
                style={f({
                  padding: "8px 14px",
                  background: "transparent",
                  color: t.text,
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  cursor: payload ? "pointer" : "not-allowed",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: payload ? 1 : 0.5,
                })}
              >
                Copy HTML
              </button>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "stretch",
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="you@example.com"
                  disabled={sending || !activeId}
                  style={f({
                    padding: "8px 12px",
                    background: "transparent",
                    color: t.text,
                    border: "none",
                    outline: "none",
                    fontSize: "12px",
                    fontWeight: 500,
                    minWidth: "200px",
                  })}
                />
                <button
                  onClick={handleSendTest}
                  disabled={sending || !activeId || !testRecipient.trim()}
                  style={f({
                    padding: "8px 14px",
                    background: t.accent,
                    color: t.accentText,
                    border: "none",
                    borderLeft: `1px solid ${t.border}`,
                    cursor:
                      sending || !activeId || !testRecipient.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    opacity:
                      sending || !activeId || !testRecipient.trim() ? 0.5 : 1,
                  })}
                >
                  {sending ? "Sending…" : "Send Test"}
                </button>
              </div>
              <button
                onClick={handleOpenRaw}
                disabled={!activeId}
                style={f({
                  padding: "8px 14px",
                  background: "transparent",
                  color: t.text,
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  cursor: activeId ? "pointer" : "not-allowed",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: activeId ? 1 : 0.5,
                })}
              >
                Open in new tab
              </button>
            </div>

            {previewError && (
              <div
                style={f({
                  padding: "12px 14px",
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  color: t.text,
                  fontSize: "13px",
                  marginBottom: "12px",
                })}
              >
                {previewError}
              </div>
            )}

            <div
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                background: "#0a0a0a",
                overflow: "hidden",
                minHeight: "640px",
              }}
            >
              {loadingPreview && !payload && (
                <div
                  style={f({
                    padding: "24px",
                    color: "#a3a3a3",
                    fontSize: "13px",
                  })}
                >
                  Loading preview…
                </div>
              )}
              {view === "rendered" && payload && (
                <iframe
                  title="Email preview"
                  srcDoc={iframeSrcDoc}
                  sandbox=""
                  style={{
                    width: "100%",
                    height: "720px",
                    border: "none",
                    background: "#0a0a0a",
                    display: "block",
                  }}
                />
              )}
              {view === "html" && payload && (
                <pre
                  style={{
                    margin: 0,
                    padding: "16px",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "#e5e5e5",
                    background: "#0a0a0a",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "720px",
                    overflow: "auto",
                  }}
                >
                  {payload.html}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}
