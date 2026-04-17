import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useTheme } from "./ThemeContext";

interface Props {
  projectId: string;
  onChange?: (muted: boolean) => void;
}

export default function ProjectMuteToggle({ projectId, onChange }: Props) {
  const { t } = useTheme();
  const [muted, setMuted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = () => {
    setMuted(null);
    setError(null);
    setLoadFailed(false);
    let cancelled = false;
    api
      .getProjectMutes()
      .then((res) => {
        if (cancelled) return;
        const isMuted = res.projectIds.includes(projectId);
        setMuted(isMuted);
        onChange?.(isMuted);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadFailed(true);
        setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const toggle = async () => {
    if (muted === null || saving || loadFailed) return;
    setSaving(true);
    setError(null);
    const next = !muted;
    try {
      if (next) await api.muteProject(projectId);
      else await api.unmuteProject(projectId);
      setMuted(next);
      onChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const f = (s: object) => ({
    fontFamily: "'Montserrat', sans-serif" as const,
    ...s,
  });

  const isMuted = muted === true;
  const label = loadFailed
    ? "Notifications status unavailable"
    : muted === null
      ? "Loading…"
      : isMuted
        ? "Notifications muted"
        : "Notifications on";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "8px",
      }}
      data-testid="project-mute-toggle"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isMuted ? t.textMuted : t.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {isMuted ? (
          <>
            <path d="M13.73 21a2 2 0 01-3.46 0" />
            <path d="M18.63 13A17.89 17.89 0 0118 8" />
            <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
            <path d="M18 8a6 6 0 00-9.33-5" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        ) : (
          <>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </>
        )}
      </svg>
      <span
        style={f({
          fontWeight: 500,
          fontSize: "12px",
          color: isMuted ? t.textMuted : t.text,
        })}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={loadFailed ? load : toggle}
        disabled={!loadFailed && (muted === null || saving)}
        style={f({
          fontWeight: 600,
          fontSize: "11px",
          color: t.text,
          background: "transparent",
          border: `1px solid ${t.border}`,
          borderRadius: "6px",
          padding: "4px 10px",
          cursor:
            !loadFailed && (muted === null || saving) ? "default" : "pointer",
          opacity: !loadFailed && (muted === null || saving) ? 0.6 : 1,
        })}
        data-testid="project-mute-button"
      >
        {loadFailed
          ? "Retry"
          : saving
            ? "Saving…"
            : isMuted
              ? "Unmute"
              : "Mute"}
      </button>
      {error && (
        <span
          style={f({
            fontWeight: 500,
            fontSize: "11px",
            color: "#e57373",
          })}
        >
          {error}
        </span>
      )}
    </div>
  );
}
