import { useState } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/logo.webp";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/contact", label: "Contact" },
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
          background: "transparent",
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
            padding: "24px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "60px",
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
                fontSize: "32px",
                lineHeight: 1,
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(36px, 6vw, 72px)",
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  color: location === link.href ? "#ffffff" : "rgba(255,255,255,0.4)",
                  transition: "color 0.2s",
                  display: "block",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: "auto", paddingBottom: "16px" }}>
            <a
              href="https://www.instagram.com/pgtsndproductions/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Instagram
            </a>
          </div>
        </div>
      )}
    </>
  );
}
