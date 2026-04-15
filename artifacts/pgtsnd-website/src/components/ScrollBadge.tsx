export default function ScrollBadge({
  position = "bottom-left",
  inline = false,
}: {
  position?: "bottom-left" | "bottom-right";
  inline?: boolean;
}) {
  const size = 120;
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
    <div style={style}>
      <div className="animate-spin-slow" style={{ width: `${size}px`, height: `${size}px`, position: "relative" }}>
        <svg viewBox="0 0 120 120" width={size} height={size}>
          <defs>
            <path
              id="circle-text-path"
              d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"
            />
          </defs>
          <text
            fill="white"
            fontSize="12"
            fontFamily="Montserrat, sans-serif"
            fontWeight="700"
            letterSpacing="4"
            textAnchor="start"
          >
            <textPath href="#circle-text-path">
              SCROLL DOWN FOR MORE &bull; SCROLL DOWN FOR MORE &bull;
            </textPath>
          </text>
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 11V3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 6L7 2L11 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
