import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CTAButton from "../components/CTAButton";
import { useAuth, getDashboardPath } from "../lib/auth";
import {
  consumePostLoginRedirect,
  consumeSessionExpiredMessage,
  consumeSignedOutMessage,
} from "../lib/session-expired";

export default function TeamLogin() {
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { loginWithToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const saved = consumePostLoginRedirect();
      if (saved) {
        navigate(saved);
        return;
      }
      const role = user.role;
      if (role === "owner" || role === "partner" || role === "crew") {
        navigate("/team/dashboard");
      } else {
        navigate(getDashboardPath(role));
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const expiredMsg = consumeSessionExpiredMessage();
    if (expiredMsg) {
      setError(expiredMsg);
      return;
    }
    const signedOutMsg = consumeSignedOutMessage();
    if (signedOutMsg) setError(signedOutMsg);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithToken(email, accessToken);
      if (result.success) {
        navigate(result.redirect || "/team/dashboard");
        return;
      }
      setError(result.error || "Invalid email or access token");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
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
          Enter your team email and the access token your project lead issued you.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "32px" }}>
            <label
              htmlFor="team-token"
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
              Access Token
            </label>
            <input
              id="team-token"
              type="text"
              value={accessToken}
              onChange={(e) => { setAccessToken(e.target.value); setError(""); }}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-..."
              autoComplete="off"
              spellCheck={false}
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
                letterSpacing: "0.05em",
              }}
            />
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
                marginTop: "10px",
                lineHeight: 1.5,
              }}
            >
              Your project lead issues this token. It is one-of-a-kind and can be revoked at any time.
            </p>
          </div>
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

          <CTAButton
            type="submit"
            disabled={submitting}
            label={submitting ? "Signing In..." : "Sign In"}
          />
        </form>

        <div
          style={{
            marginTop: "64px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.15)",
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
              marginBottom: "12px",
            }}
          >
            Demo Access
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              marginBottom: "16px",
            }}
          >
            Paste any of these access tokens to sign in as a demo user. Email is ignored for demo tokens.
          </p>
          {[
            { label: "Owner", token: "DEMO-OWNER-2026" },
            { label: "Crew",  token: "DEMO-CREW-2026"  },
            { label: "Client", token: "DEMO-CLIENT-2026" },
          ].map(({ label, token }) => (
            <div
              key={token}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {label}
              </span>
              <button
                type="button"
                onClick={() => { setAccessToken(token); setError(""); }}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.05em",
                  color: "#ffffff",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {token}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
