import { useState } from "react";
import { Link } from "wouter";

interface CTAButtonBaseProps {
  label: string;
  variant?: "dark" | "light";
}

interface CTAButtonLinkProps extends CTAButtonBaseProps {
  href: string;
  external?: boolean;
  type?: never;
  disabled?: never;
  onClick?: never;
}

interface CTAButtonSubmitProps extends CTAButtonBaseProps {
  type: "submit";
  disabled?: boolean;
  onClick?: () => void;
  href?: never;
  external?: never;
}

type CTAButtonProps = CTAButtonLinkProps | CTAButtonSubmitProps;

export default function CTAButton(props: CTAButtonProps) {
  const { label, variant = "light" } = props;
  const [hovered, setHovered] = useState(false);
  const isDark = variant === "dark";
  const isDisabled = "disabled" in props && props.disabled;

  const bgDefault = isDark ? "#000000" : "#ffffff";
  const fgDefault = isDark ? "#ffffff" : "#000000";
  const circleBg = isDark ? "#ffffff" : "#000000";
  const circleFg = isDark ? "#000000" : "#ffffff";

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    background: bgDefault,
    border: `2px solid ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.12)"}`,
    borderRadius: "999px",
    padding: "4px 4px",
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    cursor: isDisabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    minWidth: "300px",
    opacity: isDisabled ? 0.6 : 1,
  };

  const circleExpandStyle: React.CSSProperties = {
    position: "absolute",
    top: "3px",
    left: "3px",
    bottom: "3px",
    width: hovered && !isDisabled ? "calc(100% - 6px)" : "36px",
    background: circleBg,
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
    flexShrink: 0,
  };

  const labelStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    flex: 1,
    textAlign: "center",
    padding: "0 20px",
    color: hovered && !isDisabled ? circleFg : fgDefault,
    transition: "color 0.35s ease",
  };

  const content = (
    <>
      <div style={circleExpandStyle} />
      <span style={arrowStyle}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transition: "transform 0.35s ease",
            transform: hovered && !isDisabled ? "rotate(0deg)" : "rotate(-45deg)",
          }}
        >
          <path
            d="M1 7h12M8 2l5 5-5 5"
            stroke={circleFg}
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

  if ("type" in props && props.type === "submit") {
    return (
      <button type="submit" disabled={isDisabled} style={buttonStyle} {...handlers}>
        {content}
      </button>
    );
  }

  const { href, external } = props as CTAButtonLinkProps;

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
