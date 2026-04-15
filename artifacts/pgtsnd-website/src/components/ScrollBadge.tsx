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

  const chars = "SCROLL DOWN FOR MORE".split("");
  const r = 28;
  const cx = 50;
  const cy = 50;
  const charAngle = 18.5;
  const spaceAngle = 11;
  const angles: number[] = [];
  let current = -90;
  for (const c of chars) {
    angles.push(current);
    current += c === " " ? spaceAngle : charAngle;
  }

  return (
    <div style={style} className="animate-spin-slow">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {chars.map((char, i) => {
          const angle = angles[i];
          const rad = (angle * Math.PI) / 180;
          const x = cx + r * Math.cos(rad);
          const y = cy + r * Math.sin(rad);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill="white"
              fontSize="11.5"
              fontFamily="Montserrat, sans-serif"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${angle + 90}, ${x}, ${y})`}
            >
              {char}
            </text>
          );
        })}
        <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="2.5" />
        <line x1="50" y1="57" x2="50" y2="44" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <polyline points="44.5,49 50,43.5 55.5,49" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
