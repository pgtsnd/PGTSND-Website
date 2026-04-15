import { Link } from "wouter";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#000000",
        padding: "100px 32px 60px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "40px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(48px, 8vw, 96px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                color: "#ffffff",
              }}
            >
              ready to roll?
            </p>
            <p
              style={{
                marginTop: "24px",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.7)",
                maxWidth: "480px",
                lineHeight: 1.6,
              }}
            >
              Tell us what success looks like to you. We'll build the assets to get you there.
            </p>
          </div>
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "16px",
              background: "#000000",
              border: "2px solid #ffffff",
              borderRadius: "999px",
              padding: "12px 28px 12px 14px",
              color: "#ffffff",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#ffffff",
                color: "#000000",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </span>
            Let's Talk
          </Link>
        </div>

        <div
          style={{
            marginTop: "80px",
            paddingTop: "40px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            © {new Date().getFullYear()} PGTSND Productions. All rights reserved.
          </p>
          <nav style={{ display: "flex", gap: "32px" }}>
            {[
              { href: "/", label: "Home" },
              { href: "/services", label: "Services" },
              { href: "/about", label: "About" },
              { href: "/case-studies", label: "Case Studies" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
