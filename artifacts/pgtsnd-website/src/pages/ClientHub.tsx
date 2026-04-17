import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CTAButton from "../components/CTAButton";
import { useAuth } from "../lib/auth";
import { consumePostLoginRedirect, consumeSessionExpiredMessage } from "../lib/session-expired";

export default function ClientHub() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { loginWithToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const saved = consumePostLoginRedirect();
      navigate(saved || "/client-hub/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const expiredMsg = consumeSessionExpiredMessage();
    if (expiredMsg) setError(expiredMsg);
  }, []);

  const inputStyle: React.CSSProperties = {
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
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "rgba(255,255,255,0.5)",
    display: "block",
    marginBottom: "8px",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithToken(email, token);
      if (result.success) {
        navigate(result.redirect || "/client-hub/dashboard");
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
          paddingTop: "140px",
          paddingBottom: "80px",
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
          Client Hub
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
          Sign In
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
          Enter the email and access token your project lead handed you.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "32px" }}>
            <label style={labelStyle}>Access Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-..."
              autoComplete="off"
              spellCheck={false}
              style={{ ...inputStyle, letterSpacing: "0.05em" }}
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
              Your project lead hands this to you in person or in a secure channel.
            </p>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@company.com"
              style={inputStyle}
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

        <div style={{ marginTop: "40px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.6,
            }}
          >
            Don't have an access token? Reach out to your project lead and they will issue
            you one.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
