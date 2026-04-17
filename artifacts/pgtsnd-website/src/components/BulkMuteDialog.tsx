import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useTheme } from "./ThemeContext";

interface ProjectOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  projects: ProjectOption[];
  onClose: () => void;
  onApplied?: () => void;
}

export default function BulkMuteDialog({
  open,
  projects,
  onClose,
  onApplied,
}: Props) {
  const { t } = useTheme();
  const [mutedIds, setMutedIds] = useState<Set<string> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelected(new Set());
    setQuery("");
    setMutedIds(null);
    api
      .getProjectMutes()
      .then((res) => setMutedIds(new Set(res.projectIds)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = filtered.every((p) => next.has(p.id));
      if (allChecked) {
        filtered.forEach((p) => next.delete(p.id));
      } else {
        filtered.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const apply = async (action: "mute" | "unmute") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      if (action === "mute") {
        await api.muteProjects(ids);
      } else {
        await api.unmuteProjects(ids);
      }
      onApplied?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const f = (s: object) => ({
    fontFamily: "'Montserrat', sans-serif" as const,
    ...s,
  });

  const allFilteredChecked =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const selectedMutedCount = Array.from(selected).filter((id) =>
    mutedIds?.has(id),
  ).length;
  const selectedUnmutedCount = selected.size - selectedMutedCount;

  return (
    <div
      data-testid="bulk-mute-dialog"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <h2
            style={f({
              fontWeight: 700,
              fontSize: "16px",
              color: t.text,
              marginBottom: "4px",
            })}
          >
            Mute notifications
          </h2>
          <p
            style={f({
              fontWeight: 400,
              fontSize: "12px",
              color: t.textMuted,
            })}
          >
            Select projects to silence — or unsilence — email notifications for.
          </p>
        </div>

        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            data-testid="bulk-mute-search"
            style={f({
              fontWeight: 400,
              fontSize: "13px",
              color: t.text,
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: "6px",
              padding: "8px 12px",
              width: "100%",
              outline: "none",
              boxSizing: "border-box" as const,
            })}
          />
          {filtered.length > 0 && (
            <label
              style={f({
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                fontWeight: 500,
                fontSize: "12px",
                color: t.textMuted,
                cursor: "pointer",
              })}
            >
              <input
                type="checkbox"
                checked={allFilteredChecked}
                onChange={selectAllFiltered}
                data-testid="bulk-mute-select-all"
              />
              {allFilteredChecked
                ? "Clear selection"
                : `Select all (${filtered.length})`}
            </label>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
          }}
        >
          {error && (
            <p
              style={f({
                fontWeight: 500,
                fontSize: "12px",
                color: "#e57373",
                padding: "8px 12px",
              })}
            >
              {error}
            </p>
          )}
          {mutedIds === null && !error && (
            <p
              style={f({
                fontWeight: 400,
                fontSize: "12px",
                color: t.textMuted,
                padding: "12px",
              })}
            >
              Loading…
            </p>
          )}
          {mutedIds !== null && filtered.length === 0 && (
            <p
              style={f({
                fontWeight: 400,
                fontSize: "12px",
                color: t.textMuted,
                padding: "12px",
              })}
            >
              No projects match.
            </p>
          )}
          {mutedIds !== null &&
            filtered.map((p) => {
              const isMuted = mutedIds.has(p.id);
              const isChecked = selected.has(p.id);
              return (
                <label
                  key={p.id}
                  data-testid={`bulk-mute-row-${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isChecked ? t.activeNav : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(p.id)}
                    data-testid={`bulk-mute-checkbox-${p.id}`}
                  />
                  <span
                    style={f({
                      fontWeight: 500,
                      fontSize: "13px",
                      color: t.text,
                      flex: 1,
                    })}
                  >
                    {p.name}
                  </span>
                  {isMuted && (
                    <span
                      style={f({
                        fontWeight: 600,
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: t.textMuted,
                        border: `1px solid ${t.border}`,
                        borderRadius: "4px",
                        padding: "2px 6px",
                      })}
                    >
                      Muted
                    </span>
                  )}
                </label>
              );
            })}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span
            style={f({
              fontWeight: 500,
              fontSize: "12px",
              color: t.textMuted,
            })}
          >
            {selected.size === 0 ? "No projects selected" : `${selected.size} selected`}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={f({
                fontWeight: 600,
                fontSize: "12px",
                color: t.text,
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "6px",
                padding: "8px 14px",
                cursor: "pointer",
              })}
            >
              Cancel
            </button>
            {selectedMutedCount > 0 && (
              <button
                type="button"
                onClick={() => apply("unmute")}
                disabled={saving}
                data-testid="bulk-mute-unmute-btn"
                style={f({
                  fontWeight: 600,
                  fontSize: "12px",
                  color: t.text,
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  padding: "8px 14px",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                })}
              >
                Unmute ({selectedMutedCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => apply("mute")}
              disabled={saving || selectedUnmutedCount === 0}
              data-testid="bulk-mute-mute-btn"
              style={f({
                fontWeight: 600,
                fontSize: "12px",
                color: t.accentText,
                background: t.accent,
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                cursor:
                  saving || selectedUnmutedCount === 0 ? "default" : "pointer",
                opacity: saving || selectedUnmutedCount === 0 ? 0.6 : 1,
              })}
            >
              {saving
                ? "Saving…"
                : selectedUnmutedCount > 0
                  ? `Mute ${selectedUnmutedCount}`
                  : "Mute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
