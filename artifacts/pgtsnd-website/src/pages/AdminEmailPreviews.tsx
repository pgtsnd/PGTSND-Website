import { useEffect, useMemo, useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useToast } from "../components/Toast";

interface TemplateInfo {
  id: string;
  label: string;
  description: string;
}

interface TemplatePayload extends TemplateInfo {
  html: string;
}

const f = (s: object) => ({
  fontFamily: "'Montserrat', sans-serif" as const,
  ...s,
});

export default function AdminEmailPreviews() {
  const { t } = useTheme();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [payload, setPayload] = useState<TemplatePayload | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [view, setView] = useState<"rendered" | "html">("rendered");

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

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError(null);
    fetch(`/api/admin/email-previews/${activeId}`, { credentials: "include" })
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
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const iframeSrcDoc = useMemo(() => payload?.html ?? "", [payload]);

  const handleCopy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload.html);
      toast("HTML copied to clipboard", "success");
    } catch {
      toast("Failed to copy HTML", "error");
    }
  };

  const handleOpenRaw = () => {
    if (!activeId) return;
    window.open(
      `/api/admin/email-previews/${activeId}?format=html`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
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
            maxWidth: "640px",
          })}
        >
          Preview each notification email with sample data. Use Copy HTML to
          paste into Litmus or another email-testing service.
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

        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          <div style={{ width: "260px", flexShrink: 0 }}>
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
              {loadingPreview && (
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
              {!loadingPreview && view === "rendered" && payload && (
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
              {!loadingPreview && view === "html" && payload && (
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
