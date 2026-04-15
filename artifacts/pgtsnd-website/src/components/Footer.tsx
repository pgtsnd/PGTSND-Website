import { Link } from "wouter";
import logo from "@assets/logo.webp";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#000000",
        padding: "80px 32px 40px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: "60px",
            alignItems: "start",
          }}
        >
          <div>
            <img
              src={logo}
              alt="PGTSND Productions"
              style={{ width: "120px", height: "auto" }}
            />
          </div>

          <div>
            <h4
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#ffffff",
                marginBottom: "16px",
              }}
            >
              About PGTSND
            </h4>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
                maxWidth: "320px",
                marginBottom: "24px",
              }}
            >
              PGTSND Productions delivers film, photography, and content that demonstrate the care, impact, and technical expertise behind the industries that keep the world moving.
            </p>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <a
                href="https://www.instagram.com/pgtsndproductions/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ffffff", display: "flex" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="mailto:hello@pgtsndproductions.com"
                style={{ color: "#ffffff", display: "flex" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#ffffff",
                marginBottom: "16px",
              }}
            >
              Keep<br />Exploring
            </h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/services", label: "Services" },
                { href: "/case-studies", label: "Case Studies" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div
          style={{
            marginTop: "80px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.8,
            }}
          >
            ©PGTSND Productions 2025 |<br />
            Seattle, Washington<br />
            Terms & Conditions |<br />
            Privacy Policy
          </p>
        </div>
      </div>
    </footer>
  );
}
