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
    position: "relative",
    overflow: "hidden",
    background: isDark ? "#000000" : "#ffffff",
    border: isDark ? "2px solid rgba(255,255,255,0.4)" : "2px solid transparent",
    borderRadius: "999px",
    padding: "4px 4px",
    color: isDark ? "#ffffff" : "#000000",
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    minWidth: "300px",
    transition: "border-color 0.4s ease",
  };

  const fillStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: hovered ? "100%" : "0%",
    background: isDark ? "#ffffff" : "#000000",
    borderRadius: "999px",
    transition: "width 0.45s ease",
    zIndex: 0,
  };

  const arrowStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: hovered ? "transparent" : (isDark ? "#ffffff" : "#000000"),
    flexShrink: 0,
    transition: "background 0.35s ease",
  };

  const arrowColor = hovered
    ? (isDark ? "#000000" : "#ffffff")
    : (isDark ? "#000000" : "#ffffff");

  const labelStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    flex: 1,
    textAlign: "center",
    padding: "0 20px",
    color: hovered
      ? (isDark ? "#000000" : "#ffffff")
      : (isDark ? "#ffffff" : "#000000"),
    transition: "color 0.35s ease",
  };

  const content = (
    <>
      <div style={fillStyle} />
      <span style={arrowStyle}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transition: "transform 0.35s ease",
            transform: hovered ? "rotate(0deg)" : "rotate(-45deg)",
          }}
        >
          <path
            d="M1 7h12M8 2l5 5-5 5"
            stroke={arrowColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span style={labelStyle}>{label}</span>
    </>
  );

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={buttonStyle} {...handlers}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} style={buttonStyle} {...handlers}>
      {content}
    </Link>
  );
}
