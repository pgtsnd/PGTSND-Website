export default function ScrollBadge({ position = "bottom-left" }: { position?: "bottom-left" | "bottom-right" }) {
  const style: React.CSSProperties = {
    position: "absolute",
    bottom: "40px",
    ...(position === "bottom-right" ? { right: "40px" } : { left: "40px" }),
    width: "80px",
    height: "80px",
  };

  return (
    <div style={style}>
      <div className="animate-spin-slow" style={{ width: "80px", height: "80px", position: "relative" }}>
        <svg viewBox="0 0 80 80" width="80" height="80">
          <defs>
            <path
              id="circle-text-path"
              d="M 40,40 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"
            />
          </defs>
          <text
            fill="white"
            fontSize="9"
            fontFamily="Montserrat, sans-serif"
            fontWeight="600"
            letterSpacing="2"
            textAnchor="start"
          >
            <textPath href="#circle-text-path">
              SCROLL DOWN FOR MORE • SCROLL DOWN FOR MORE •&nbsp;
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8l4 4-4 4M8 12h8" />
        </svg>
      </div>
    </div>
  );
}
