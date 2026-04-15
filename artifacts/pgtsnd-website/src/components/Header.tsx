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

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link href="/">
          <img
            src={logo}
            alt="PGTSND Productions"
            style={{ height: "60px", width: "auto" }}
          />
        </Link>

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <span
            style={{
              display: "block",
              width: "28px",
              height: "2px",
              background: "#ffffff",
            }}
          />
          <span
            style={{
              display: "block",
              width: "28px",
              height: "2px",
              background: "#ffffff",
            }}
          />
        </button>
      </header>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "#000000",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 32px",
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
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: "28px",
                lineHeight: 1,
                padding: "8px",
              }}
            >
              ✕
            </button>
          </div>

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
      )}
    </>
  );
}
