import { useTheme } from "./ThemeContext";

if (typeof document !== "undefined") {
  const id = "team-shimmer-keyframes";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes teamShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`;
    document.head.appendChild(style);
  }
}

function ShimmerBlock({ width, height, borderRadius = "6px", style }: {
  width: string;
  height: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useTheme();
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: `linear-gradient(90deg, ${t.bgCard} 25%, rgba(255,255,255,0.06) 50%, ${t.bgCard} 75%)`,
      backgroundSize: "200% 100%",
      animation: "teamShimmer 1.8s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ height = "160px" }: { height?: string }) {
  const { t } = useTheme();
  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: "12px",
      padding: "24px",
      height,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      <ShimmerBlock width="60%" height="14px" />
      <ShimmerBlock width="40%" height="10px" />
      <div style={{ flex: 1 }} />
      <ShimmerBlock width="80%" height="8px" />
    </div>
  );
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  const { t } = useTheme();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "16px 20px",
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
        }}>
          <ShimmerBlock width="36px" height="36px" borderRadius="50%" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <ShimmerBlock width="50%" height="12px" />
            <ShimmerBlock width="30%" height="10px" />
          </div>
          <ShimmerBlock width="60px" height="20px" borderRadius="4px" />
        </div>
      ))}
    </>
  );
}

export function SkeletonStat() {
  const { t } = useTheme();
  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: "10px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      <ShimmerBlock width="40%" height="10px" />
      <ShimmerBlock width="60%" height="22px" />
      <ShimmerBlock width="70%" height="10px" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "40px" }}>
        <ShimmerBlock width="80px" height="12px" style={{ marginBottom: "8px" }} />
        <ShimmerBlock width="200px" height="28px" style={{ marginBottom: "6px" }} />
        <ShimmerBlock width="260px" height="12px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
        <SkeletonCard height="180px" />
        <SkeletonCard height="180px" />
        <SkeletonCard height="180px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        <SkeletonCard height="200px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonRow count={3} />
        </div>
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <ShimmerBlock width="120px" height="24px" />
        <ShimmerBlock width="120px" height="36px" borderRadius="6px" />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerBlock key={i} width="80px" height="32px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <SkeletonCard height="220px" />
        <SkeletonCard height="220px" />
        <SkeletonCard height="220px" />
        <SkeletonCard height="220px" />
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "32px 48px", maxWidth: "1200px" }}>
      <ShimmerBlock width="100px" height="12px" style={{ marginBottom: "20px" }} />
      <ShimmerBlock width="300px" height="24px" style={{ marginBottom: "8px" }} />
      <ShimmerBlock width="200px" height="12px" style={{ marginBottom: "24px" }} />
      <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${t.border}`, marginBottom: "28px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerBlock key={i} width="80px" height="14px" style={{ margin: "12px 20px" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "32px" }}>
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ display: "flex", height: "calc(100vh - 0px)" }}>
      <div style={{ width: "340px", borderRight: `1px solid ${t.border}`, padding: "24px 20px" }}>
        <ShimmerBlock width="120px" height="20px" style={{ marginBottom: "16px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonRow count={4} />
        </div>
      </div>
      <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <ShimmerBlock width="200px" height="16px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ShimmerBlock width="50%" height="60px" borderRadius="12px" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <ShimmerBlock width="40%" height="48px" borderRadius="12px" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ShimmerBlock width="55%" height="52px" borderRadius="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrewSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <ShimmerBlock width="100px" height="24px" style={{ marginBottom: "6px" }} />
          <ShimmerBlock width="200px" height="12px" />
        </div>
        <ShimmerBlock width="130px" height="36px" borderRadius="6px" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkeletonRow count={4} />
      </div>
    </div>
  );
}

export function ClientsSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <ShimmerBlock width="100px" height="24px" style={{ marginBottom: "6px" }} />
          <ShimmerBlock width="220px" height="12px" />
        </div>
        <ShimmerBlock width="120px" height="36px" borderRadius="6px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <SkeletonCard height="200px" />
        <SkeletonCard height="200px" />
      </div>
    </div>
  );
}

export function AssetsSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <ShimmerBlock width="150px" height="24px" style={{ marginBottom: "6px" }} />
          <ShimmerBlock width="200px" height="12px" />
        </div>
        <ShimmerBlock width="100px" height="36px" borderRadius="6px" />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="100px" height="32px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <SkeletonCard height="100px" />
        <SkeletonCard height="100px" />
        <SkeletonCard height="100px" />
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <ShimmerBlock width="120px" height="24px" />
        <ShimmerBlock width="180px" height="32px" borderRadius="6px" />
      </div>
      <div style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <ShimmerBlock width="100%" height="40px" />
        <ShimmerBlock width="100%" height="60px" />
        <ShimmerBlock width="100%" height="60px" />
        <ShimmerBlock width="100%" height="60px" />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1000px" }}>
      <ShimmerBlock width="120px" height="24px" style={{ marginBottom: "28px" }} />
      <div style={{ display: "flex", gap: "32px" }}>
        <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerBlock key={i} width="100%" height="36px" borderRadius="6px" />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          <ShimmerBlock width="160px" height="18px" />
          <ShimmerBlock width="100%" height="40px" borderRadius="6px" />
          <ShimmerBlock width="100%" height="40px" borderRadius="6px" />
          <ShimmerBlock width="100%" height="40px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}

export function ClientDashboardSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "40px" }}>
        <ShimmerBlock width="90px" height="12px" style={{ marginBottom: "6px" }} />
        <ShimmerBlock width="180px" height="26px" />
      </div>
      <ShimmerBlock width="100%" height="72px" borderRadius="10px" style={{ marginBottom: "36px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "36px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ShimmerBlock width="140px" height="14px" style={{ marginBottom: "8px" }} />
          <SkeletonRow count={3} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <ShimmerBlock width="140px" height="14px" style={{ marginBottom: "8px" }} />
          <SkeletonRow count={3} />
        </div>
      </div>
      <ShimmerBlock width="140px" height="14px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <SkeletonCard height="120px" />
        <SkeletonCard height="120px" />
      </div>
    </div>
  );
}

export function ClientProjectsSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "40px 48px" }}>
      <ShimmerBlock width="130px" height="24px" style={{ marginBottom: "32px" }} />
      <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="120px" height="36px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ marginBottom: "40px" }}>
        <ShimmerBlock width="200px" height="14px" style={{ marginBottom: "20px" }} />
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ flex: 1, padding: "16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
              <ShimmerBlock width="40%" height="18px" />
              <ShimmerBlock width="60%" height="10px" />
            </div>
          ))}
        </div>
        <ShimmerBlock width="100%" height="6px" borderRadius="3px" />
      </div>
      <ShimmerBlock width="100px" height="14px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="220px" height="64px" borderRadius="8px" />
        ))}
      </div>
    </div>
  );
}

export function ClientContractsSkeleton() {
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
      <ShimmerBlock width="120px" height="24px" style={{ marginBottom: "32px" }} />
      <ShimmerBlock width="100%" height="72px" borderRadius="10px" style={{ marginBottom: "28px" }} />
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="100px" height="32px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="100%" height="72px" borderRadius="10px" />
        ))}
      </div>
    </div>
  );
}

export function ClientBillingSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <ShimmerBlock width="100px" height="24px" />
        <ShimmerBlock width="110px" height="36px" borderRadius="8px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: "20px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <ShimmerBlock width="40%" height="10px" />
            <ShimmerBlock width="60%" height="24px" />
          </div>
        ))}
      </div>
      <ShimmerBlock width="180px" height="14px" style={{ marginBottom: "16px" }} />
      <div style={{ background: t.bgCard, borderRadius: "10px", border: `1px solid ${t.border}`, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="100%" height="40px" borderRadius="6px" />
        ))}
      </div>
    </div>
  );
}

export function ClientVideoReviewSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "32px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <ShimmerBlock width="120px" height="10px" />
          <ShimmerBlock width="180px" height="24px" />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <ShimmerBlock width="140px" height="40px" borderRadius="8px" />
          <ShimmerBlock width="100px" height="40px" borderRadius="8px" />
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="140px" height="32px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <ShimmerBlock width="220px" height="16px" />
            <ShimmerBlock width="80px" height="18px" borderRadius="4px" />
          </div>
          <ShimmerBlock width="100%" height="420px" borderRadius="10px" />
        </div>
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <ShimmerBlock width="120px" height="14px" />
          <SkeletonRow count={3} />
        </div>
      </div>
    </div>
  );
}

export function ClientAccountSkeleton() {
  const { t } = useTheme();
  return (
    <div style={{ padding: "48px 56px" }}>
      <ShimmerBlock width="160px" height="28px" style={{ marginBottom: "40px" }} />
      <div style={{ display: "flex", gap: "6px", marginBottom: "48px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} width="110px" height="36px" borderRadius="6px" />
        ))}
      </div>
      <div style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "48px" }}>
          <ShimmerBlock width="72px" height="72px" borderRadius="50%" />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <ShimmerBlock width="60%" height="18px" />
            <ShimmerBlock width="40%" height="12px" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: "24px" }}>
            <ShimmerBlock width="80px" height="10px" style={{ marginBottom: "8px" }} />
            <ShimmerBlock width="100%" height="42px" borderRadius="6px" />
          </div>
        ))}
        <ShimmerBlock width="160px" height="40px" borderRadius="6px" style={{ marginTop: "16px" }} />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid rgba(255,100,100,0.15)`,
      borderRadius: "12px",
      padding: "48px",
      textAlign: "center" as const,
      maxWidth: "480px",
      margin: "0 auto",
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.6)" strokeWidth="1.5" style={{ marginBottom: "16px" }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={f({ fontWeight: 600, fontSize: "15px", color: t.text, marginBottom: "6px" })}>
        Something went wrong
      </p>
      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "20px", lineHeight: 1.5 })}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={f({
            fontWeight: 600,
            fontSize: "12px",
            color: t.accentText,
            background: t.accent,
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          })}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
