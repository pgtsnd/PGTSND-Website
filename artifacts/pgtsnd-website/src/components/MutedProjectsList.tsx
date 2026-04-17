import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useTheme } from "./ThemeContext";

interface Props {
  variant?: "team" | "client";
}

interface Row {
  id: string;
  name: string;
  status: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  archived: "Archived",
  delivered: "Delivered",
  lead: "Lead",
  active: "Active",
  in_progress: "In progress",
  review: "Review",
};

export default function MutedProjectsList({ variant = "team" }: Props) {
  const { t } = useTheme();
  void variant;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unmuting, setUnmuting] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkUnmuting, setBulkUnmuting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const mutes = await api.getProjectMutes();
      setRows(
        mutes.mutes.map((m) => ({
          id: m.id,
          name: m.name ?? "Unknown project",
          status: m.status,
        })),
      );
      setSelected((prev) => {
        const valid = new Set(mutes.projectIds);
        const next = new Set<string>();
        prev.forEach((id) => {
          if (valid.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unmute = async (id: string) => {
    setUnmuting((m) => ({ ...m, [id]: true }));
    try {
      await api.unmuteProject(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unmute");
    } finally {
      setUnmuting((m) => {
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!rows) return;
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  };

  const bulkUnmute = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkUnmuting(true);
    setError(null);
    try {
      await api.unmuteProjects(ids);
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unmute");
    } finally {
      setBulkUnmuting(false);
    }
  };

  const f = (s: object) => ({
    fontFamily: "'Montserrat', sans-serif" as const,
    ...s,
  });

  const allSelected = !!rows && rows.length > 0 && selected.size === rows.length;

  return (
    <div data-testid="muted-projects-list" style={{ marginTop: "32px" }}>
      <h3
        style={f({
          fontWeight: 600,
          fontSize: "14px",
          color: t.text,
          marginBottom: "4px",
        })}
      >
        Muted projects
      </h3>
      <p
        style={f({
          fontWeight: 400,
          fontSize: "12px",
          color: t.textMuted,
          marginBottom: "16px",
        })}
      >
        Projects you've silenced email notifications for.
      </p>

      {error && (
        <div
          style={f({
            fontWeight: 500,
            fontSize: "12px",
            color: "#e57373",
            marginBottom: "12px",
          })}
        >
          {error}{" "}
          <button
            type="button"
            onClick={load}
            style={f({
              fontWeight: 600,
              fontSize: "11px",
              color: t.text,
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: "4px",
              padding: "2px 8px",
              cursor: "pointer",
              marginLeft: "8px",
            })}
          >
            Retry
          </button>
        </div>
      )}

      {rows === null && !error && (
        <p
          style={f({
            fontWeight: 400,
            fontSize: "12px",
            color: t.textMuted,
          })}
        >
          Loading…
        </p>
      )}

      {rows && rows.length === 0 && (
        <p
          data-testid="muted-projects-empty"
          style={f({
            fontWeight: 400,
            fontSize: "12px",
            color: t.textMuted,
          })}
        >
          You haven't muted any projects.
        </p>
      )}

      {rows && rows.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              gap: "12px",
            }}
          >
            <label
              style={f({
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 500,
                fontSize: "12px",
                color: t.textMuted,
                cursor: "pointer",
              })}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                data-testid="muted-projects-select-all"
              />
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select all"}
            </label>
            <button
              type="button"
              onClick={bulkUnmute}
              disabled={selected.size === 0 || bulkUnmuting}
              data-testid="muted-projects-bulk-unmute"
              style={f({
                fontWeight: 600,
                fontSize: "11px",
                color: t.text,
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "6px",
                padding: "6px 12px",
                cursor:
                  selected.size === 0 || bulkUnmuting ? "default" : "pointer",
                opacity: selected.size === 0 || bulkUnmuting ? 0.5 : 1,
              })}
            >
              {bulkUnmuting
                ? "Unmuting…"
                : selected.size > 1
                  ? `Unmute ${selected.size} projects`
                  : "Unmute selected"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {rows.map((row) => {
              const busy = !!unmuting[row.id] || bulkUnmuting;
              const isChecked = selected.has(row.id);
              const showStatus =
                row.status &&
                (row.status === "archived" || row.status === "delivered");
              const statusLabel = row.status
                ? STATUS_LABELS[row.status] ?? row.status
                : null;
              return (
                <div
                  key={row.id}
                  data-testid={`muted-project-row-${row.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: t.bgCard,
                    border: `1px solid ${t.border}`,
                    borderRadius: "8px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelected(row.id)}
                      data-testid={`muted-project-select-${row.id}`}
                      disabled={bulkUnmuting}
                    />
                    <span
                      style={f({
                        fontWeight: 500,
                        fontSize: "13px",
                        color: t.text,
                      })}
                    >
                      {row.name}
                    </span>
                    {showStatus && statusLabel && (
                      <span
                        data-testid={`muted-project-status-${row.id}`}
                        style={f({
                          fontWeight: 600,
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: t.textMuted,
                          background: "transparent",
                          border: `1px solid ${t.border}`,
                          borderRadius: "4px",
                          padding: "2px 6px",
                        })}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => unmute(row.id)}
                    disabled={busy}
                    data-testid={`muted-project-unmute-${row.id}`}
                    style={f({
                      fontWeight: 600,
                      fontSize: "11px",
                      color: t.text,
                      background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.6 : 1,
                    })}
                  >
                    {unmuting[row.id] ? "Unmuting…" : "Unmute"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
