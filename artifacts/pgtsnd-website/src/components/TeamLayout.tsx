import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import logo from "@assets/logo.webp";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  ownerOnly?: boolean;
}

const dashboardIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const projectsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const scheduleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const messagesIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const clientsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const crewIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const settingsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const navItems: NavItem[] = [
  { href: "/team/dashboard", label: "Dashboard", icon: dashboardIcon },
  { href: "/team/projects", label: "Projects", icon: projectsIcon },
  { href: "/team/schedule", label: "Schedule", icon: scheduleIcon },
  { href: "/team/messages", label: "Messages", badge: 5, icon: messagesIcon },
  { href: "/team/clients", label: "Clients", icon: clientsIcon, ownerOnly: true },
  { href: "/team/crew", label: "Crew", icon: crewIcon, ownerOnly: true },
  { href: "/team/settings", label: "Settings", icon: settingsIcon, ownerOnly: true },
];

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, toggle } = useTheme();
  const { currentUser } = useTeamAuth();

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "partner";
  const portalLabel = isOwner ? "Owner Dashboard" : "Team Portal";
  const filteredNav = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg }}>
      <aside
        style={{
          width: "260px",
          borderRight: `1px solid ${t.border}`,
          padding: "32px 0",
          display: "flex",
          flexDirection: "column",
          background: t.bgSidebar,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <Link href="/team/dashboard">
            <img src={logo} alt="PGTSND" style={{ width: "56px", height: "auto", filter: t.mode === "light" ? "invert(1)" : "none" }} />
          </Link>
          <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: "6px" }}>
            {t.mode === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
        </div>

        <div style={{ padding: "0 20px", marginBottom: "24px" }}>
          <div style={{ padding: "8px 12px", background: t.hoverBg, borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60d060" }} />
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>{portalLabel}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {filteredNav.map((item, idx) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            const isFirstOwnerItem = item.ownerOnly && !filteredNav[idx - 1]?.ownerOnly;
            return (
              <div key={item.href}>
                {isFirstOwnerItem && (
                  <div style={{ height: "1px", background: t.border, margin: "12px 14px" }} />
                )}
                <Link href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      marginBottom: "2px",
                      background: isActive ? t.activeNav : "transparent",
                      borderLeft: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ color: isActive ? t.text : t.textTertiary, display: "flex" }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: isActive ? 600 : 400, fontSize: "13px", color: isActive ? t.text : t.textTertiary, flex: 1 }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "10px", color: t.accentText, background: t.accent, width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.border}`, marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "12px", color: t.accentText }}>{currentUser?.initials ?? "??"}</div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, lineHeight: 1.3 }}>{currentUser?.name ?? "Team"}</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{currentUser?.title ?? ""}</p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        <style>{`
          @keyframes teamPageFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .team-page-transition {
            animation: teamPageFadeIn 220ms ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            .team-page-transition { animation: none; }
          }
        `}</style>
        <div key={location} className="team-page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
