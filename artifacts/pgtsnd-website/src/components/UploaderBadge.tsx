import { useTheme } from "./ThemeContext";

interface Props {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  fontSize?: number;
  prefix?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UploaderBadge({
  name,
  avatarUrl,
  size = 18,
  fontSize = 11,
  prefix = "Uploaded by",
}: Props) {
  const { t } = useTheme();
  const displayName = name && name.trim() ? name : "Unknown";
  const initials = name && name.trim() ? getInitials(name) : "?";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            background: t.hoverBg,
            border: `1px solid ${t.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: t.textMuted,
            fontWeight: 600,
            fontSize: `${Math.max(8, Math.round(size * 0.45))}px`,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}
      <span
        style={{
          fontWeight: 400,
          fontSize: `${fontSize}px`,
          color: t.textMuted,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {prefix} <span style={{ color: t.textSecondary, fontWeight: 500 }}>{displayName}</span>
      </span>
    </div>
  );
}
