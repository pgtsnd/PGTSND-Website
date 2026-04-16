import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../lib/auth";
import { api, type Conversation } from "../lib/api";
import logo from "@assets/logo.webp";

const navItems = [
  {
    href: "/client-hub/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/client-hub/messages",
    label: "Messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/client-hub/projects",
    label: "Projects",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/client-hub/assets",
    label: "Assets",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    href: "/client-hub/review",
    label: "Video Review",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
  },
  {
    href: "/client-hub/contracts",
    label: "Contracts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/client-hub/billing",
    label: "Billing",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: "/client-hub/account",
    label: "Account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, toggle } = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api
      .getClientMessages()
      .then((convos) => {
        const total = convos.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});
  }, []);

  const displayName = user?.name || "Client";
  const nameParts = displayName.split(" ");
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : displayName.substring(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg }}>
      <aside
        style={{
          width: "260px",
          borderRight: `1px solid ${t.border}`,
          padding: "32px 0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          background: t.bgSidebar,
        }}
      >
        <div style={{ padding: "0 28px", marginBottom: "48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/">
            <img
              src={logo}
              alt="PGTSND Productions"
              style={{ width: "80px", height: "auto", opacity: 0.9, filter: t.mode === "light" ? "invert(1)" : "none" }}
            />
          </Link>
          <button
            onClick={toggle}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: t.hoverBg,
              border: `1px solid ${t.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.textTertiary,
            }}
            title={t.mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {t.mode === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", padding: "0 12px" }}>
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "13px",
                  color: isActive ? t.text : t.textTertiary,
                  textDecoration: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: isActive ? t.activeNav : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5, display: "flex" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.label === "Messages" && unreadCount > 0 ? (
                  <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: t.badgeBg, color: t.badgeText, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "0 28px", borderTop: `1px solid ${t.border}`, paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: t.activeNav,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                color: t.text,
              }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, lineHeight: 1.3 }}>
                {displayName}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textTertiary }}>
                Client
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "260px", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
