export default function ScrollBadge({
  position = "bottom-left",
  inline = false,
}: {
  position?: "bottom-left" | "bottom-right";
  inline?: boolean;
}) {
  const size = 100;
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
            id="circle-text-path"
            d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
          />
        </defs>
        <text
          fill="white"
          fontSize="13"
          fontFamily="Montserrat, sans-serif"
          fontWeight="900"
          letterSpacing="5"
        >
          <textPath href="#circle-text-path">
            SCROLL DOWN FOR MORE &bull;
          </textPath>
        </text>
        <circle cx="50" cy="50" r="17" fill="none" stroke="white" strokeWidth="2.5" />
        <path d="M50 58V42" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M43 48L50 41L57 48" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
