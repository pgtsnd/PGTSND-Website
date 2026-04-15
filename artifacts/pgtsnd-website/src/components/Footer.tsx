import { Link } from "wouter";
import logo from "@assets/logo.webp";

export default function Footer() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer
      style={{
        background: "#000000",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "80px 80px 48px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr auto",
            gap: "80px",
            alignItems: "start",
          }}
        >
          <div>
            <img
              src={logo}
              alt="PGTSND Productions"
              style={{ width: "100%", maxWidth: "180px", height: "auto", opacity: 0.95 }}
            />
          </div>

          <div>
            <h4
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "20px",
              }}
            >
              About PGTSND
            </h4>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "13px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8,
                maxWidth: "340px",
                marginBottom: "28px",
              }}
            >
              PGTSND Productions delivers film, photography, and content that demonstrate the care, impact, and technical expertise behind the industries that keep the world moving.
            </p>
            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <a
                href="https://www.instagram.com/pgtsndproductions/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  display: "flex",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="mailto:hello@pgtsndproductions.com"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  display: "flex",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#ffffff",
                marginBottom: "20px",
              }}
            >
              Keep Exploring
            </h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            &copy;PGTSND Productions 2025 | Seattle, Washington
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <Link
              href="/terms"
              style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              Terms &amp; Conditions
            </Link>
            {" | "}
            <Link
              href="/privacy"
              style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
