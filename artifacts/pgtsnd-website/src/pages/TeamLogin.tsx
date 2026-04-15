import { useState } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";

const BYPASS_EMAIL = "demo@pgtsnd.com";

export default function TeamLogin() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase().trim() === BYPASS_EMAIL) {
      navigate("/team/dashboard");
      return;
    }
    setError("Access restricted to team members. Use your team email to sign in.");
  };

  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      <Header />

      <section
        style={{
          paddingTop: "200px",
          paddingBottom: "160px",
          paddingLeft: "80px",
          paddingRight: "80px",
          maxWidth: "520px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "28px",
          }}
        >
          Team Portal
        </p>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 48px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "20px",
          }}
        >
          Crew Sign In
        </h1>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 400,
            fontSize: "16px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: "48px",
          }}
        >
          Sign in with your team email to access the production workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "48px" }}>
            <label
              htmlFor="team-email"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Email Address
            </label>
            <input
              id="team-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@pgtsnd.com"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "#ffffff",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.3)",
                padding: "14px 0",
                width: "100%",
                outline: "none",
              }}
            />
            {error && (
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  color: "#ff6b6b",
                  marginTop: "12px",
                }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#000000",
              background: "#ffffff",
              border: "none",
              borderRadius: "100px",
              padding: "16px 48px",
              cursor: "pointer",
              minWidth: "300px",
            }}
          >
            Sign In
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
