import { Link } from "wouter";

interface CTAButtonProps {
  href: string;
  label: string;
  external?: boolean;
}

export default function CTAButton({ href, label, external }: CTAButtonProps) {
  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "16px",
    background: "#000000",
    border: "2px solid #ffffff",
    borderRadius: "999px",
    padding: "12px 28px 12px 14px",
    color: "#ffffff",
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.2s, color 0.2s",
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
        background: "#ffffff",
        color: "#000000",
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
