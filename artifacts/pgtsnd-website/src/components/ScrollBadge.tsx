export default function ScrollBadge({
  position = "bottom-left",
  inline = false,
}: {
  position?: "bottom-left" | "bottom-right";
  inline?: boolean;
}) {
  const size = 90;
  const style: React.CSSProperties = inline
    ? { width: `${size}px`, height: `${size}px`, position: "relative" as const }
    : {
        position: "absolute" as const,
        bottom: "32px",
        ...(position === "bottom-right" ? { right: "32px" } : { left: "32px" }),
        width: `${size}px`,
        height: `${size}px`,
      };

  return (
    <div style={style} className="animate-spin-slow">
      <svg viewBox="0 0 90 90" width={size} height={size}>
        <defs>
          <path
            id="scroll-text-path"
            d="M 45,45 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
          />
        </defs>
        <text
          fill="white"
          fontSize="11.5"
          fontFamily="Montserrat, sans-serif"
          fontWeight="900"
          letterSpacing="4.5"
        >
          <textPath href="#scroll-text-path">
            SCROLL DOWN FOR MORE &bull;
          </textPath>
        </text>
        <circle cx="45" cy="45" r="14" fill="none" stroke="white" strokeWidth="3" />
        <path d="M45 53V39" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M39.5 44L45 38.5L50.5 44" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
