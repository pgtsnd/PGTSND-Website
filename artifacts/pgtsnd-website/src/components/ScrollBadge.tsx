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
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <path
            id="scroll-text-path"
            d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          />
        </defs>
        <text
          fill="white"
          fontSize="9"
          fontFamily="Montserrat, sans-serif"
          fontWeight="900"
          letterSpacing="3"
        >
          <textPath href="#scroll-text-path">
            SCROLL DOWN FOR MORE &bull;
          </textPath>
        </text>
        <circle cx="50" cy="50" r="13" fill="none" stroke="white" strokeWidth="2.5" />
        <line x1="50" y1="56" x2="50" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <polyline points="44.5,49 50,43.5 55.5,49" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
