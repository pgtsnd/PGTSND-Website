import { useState } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/logo.webp";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/contact", label: "Contact" },
    { href: "/client-hub", label: "Client Hub" },
  ];

  const barBase: React.CSSProperties = {
    display: "block",
    width: "28px",
    height: "2px",
    background: "#ffffff",
    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
    transformOrigin: "center",
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          background: menuOpen ? "rgba(0, 0, 0, 0.75)" : "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          transition: "background 0.3s ease",
        }}
      >
        <Link href="/" onClick={() => setMenuOpen(false)}>
          <img
            src={logo}
            alt="PGTSND Productions"
            style={{ height: "60px", width: "auto" }}
          />
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "44px",
            height: "44px",
            position: "relative",
          }}
        >
          <span
            style={{
              ...barBase,
              position: "absolute",
              transform: menuOpen
                ? "rotate(45deg)"
                : "translateY(-4px)",
            }}
          />
          <span
            style={{
              ...barBase,
              position: "absolute",
              transform: menuOpen
                ? "rotate(-45deg)"
                : "translateY(4px)",
            }}
          />
        </button>
      </header>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 250,
          background: "rgba(0, 0, 0, 0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "108px",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      >
        <nav
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                navigate(link.href);
              }}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "38px",
                letterSpacing: "0.01em",
                lineHeight: 1.8,
                color: "#ffffff",
                textDecoration: "none",
                display: "block",
                textAlign: "center",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div style={{ padding: "24px 32px", textAlign: "center" }}>
          <a
            href="/team"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              navigate("/team");
            }}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            Team Login
          </a>
        </div>
      </div>
    </>
  );
}
