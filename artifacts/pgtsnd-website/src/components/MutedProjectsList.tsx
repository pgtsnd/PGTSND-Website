import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useTheme } from "./ThemeContext";

interface Props {
  variant?: "team" | "client";
}

interface Row {
  id: string;
  name: string;
}

export default function MutedProjectsList({ variant = "team" }: Props) {
  const { t } = useTheme();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unmuting, setUnmuting] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mutes, projects] = await Promise.all([
        api.getProjectMutes(),
        variant === "client"
          ? api.getClientDashboard().then((d) => d.projects)
          : api.getProjects(),
      ]);
      const byId = new Map(projects.map((p) => [p.id, p.name]));
      setRows(
        mutes.projectIds.map((id) => ({
          id,
          name: byId.get(id) ?? "Unknown project",
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [variant]);

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

  const f = (s: object) => ({
    fontFamily: "'Montserrat', sans-serif" as const,
    ...s,
  });

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {rows.map((row) => {
            const busy = !!unmuting[row.id];
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
                <span
                  style={f({
                    fontWeight: 500,
                    fontSize: "13px",
                    color: t.text,
                  })}
                >
                  {row.name}
                </span>
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
                  {busy ? "Unmuting…" : "Unmute"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
