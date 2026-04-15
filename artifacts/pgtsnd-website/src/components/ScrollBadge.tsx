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
            id="circle-text-path"
            d="M 45,45 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0"
          />
        </defs>
        <text
          fill="white"
          fontSize="9.5"
          fontFamily="Montserrat, sans-serif"
          fontWeight="800"
          letterSpacing="3.5"
          textAnchor="start"
        >
          <textPath href="#circle-text-path">
            SCROLL DOWN FOR MORE &bull; SCROLL DOWN FOR MORE &bull;
          </textPath>
        </text>
        <circle cx="45" cy="45" r="16" fill="none" stroke="white" strokeWidth="2" />
        <path d="M45 52V38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M39 43L45 37L51 43" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
