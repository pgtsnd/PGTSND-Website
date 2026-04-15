import { Link } from "wouter";

interface CTAButtonProps {
  href: string;
  label: string;
  external?: boolean;
  variant?: "dark" | "light";
}

export default function CTAButton({ href, label, external, variant = "dark" }: CTAButtonProps) {
  const isDark = variant === "dark";

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "16px",
    background: isDark ? "#000000" : "#ffffff",
    border: isDark ? "2px solid #ffffff" : "2px solid #ffffff",
    borderRadius: "999px",
    padding: "12px 28px 12px 14px",
    color: isDark ? "#ffffff" : "#000000",
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const arrowCircle = (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: isDark ? "#ffffff" : "#000000",
        color: isDark ? "#000000" : "#ffffff",
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M7 17L17 7M17 7H7M17 7v10" />
      </svg>
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={buttonStyle}>
        {arrowCircle}
        {label}
      </a>
    );
  }

  return (
    <Link href={href} style={buttonStyle}>
      {arrowCircle}
      {label}
    </Link>
  );
}
