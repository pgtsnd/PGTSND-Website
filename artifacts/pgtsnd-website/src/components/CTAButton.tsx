import { useState } from "react";
import { Link } from "wouter";

interface CTAButtonProps {
  href: string;
  label: string;
  external?: boolean;
  variant?: "dark" | "light";
}

export default function CTAButton({ href, label, external, variant = "light" }: CTAButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDark = variant === "dark";

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0",
    background: isDark ? "#000000" : "#ffffff",
    border: isDark ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(0,0,0,0.15)",
    borderRadius: "999px",
    padding: "6px 6px",
    color: isDark ? "#ffffff" : "#000000",
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "background 0.3s ease, border-color 0.3s ease",
    minWidth: "280px",
  };

  const arrowCircleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: isDark ? "#ffffff" : "#000000",
    flexShrink: 0,
    transition: "transform 0.3s ease",
    transform: hovered ? "scale(1.08)" : "scale(1)",
  };

  const arrowColor = isDark ? "#000000" : "#ffffff";

  const arrowCircle = (
    <span style={arrowCircleStyle}>
      <svg width="14" height="14" viewBox="0 0 512 512" fill={arrowColor}>
        <path d="M497.777 0H184.889C177.028 0 170.666 6.36133 170.666 14.2227V42.6667C170.666 50.528 177.028 56.8893 184.889 56.8893H414.889L4.16509 467.611C1.44242 470.335 0.0557541 473.887 0.0024208 477.455C-0.0535792 481.165 1.33575 484.893 4.16509 487.725L24.2744 507.833C26.9531 510.513 30.4358 511.901 33.9478 511.995C37.7131 512.096 41.5131 510.708 44.3864 507.833L455.11 97.1107V327.111C455.11 334.972 461.472 341.333 469.333 341.333H497.777C505.638 341.333 512 334.972 512 327.111V14.2227C512 6.36133 505.638 0 497.777 0Z" />
      </svg>
    </span>
  );

  const labelSpan = (
    <span
      style={{
        flex: 1,
        textAlign: "center",
        padding: "0 20px",
        transition: "letter-spacing 0.3s ease",
        letterSpacing: hovered ? "0.18em" : "0.12em",
      }}
    >
      {label}
    </span>
  );

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={buttonStyle} {...handlers}>
        {arrowCircle}
        {labelSpan}
      </a>
    );
  }

  return (
    <Link href={href} style={buttonStyle} {...handlers}>
      {arrowCircle}
      {labelSpan}
    </Link>
  );
}
