import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth, getDashboardPath } from "../lib/auth";

export default function ClientHub() {
  const [mode, setMode] = useState<"login" | "register" | "check-email">("login");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { login, googleLogin, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate(getDashboardPath(user.role));
    }
  }, [user, loading, navigate]);

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
      const result = await login(email);

      if (result.demo && result.redirect) {
        navigate(result.redirect);
        return;
      }

      if (result.success) {
        setMode("check-email");
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "check-email") {
    return (
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        <Header />
        <section
          style={{
            paddingTop: "200px",
            paddingBottom: "200px",
            paddingLeft: "80px",
            paddingRight: "80px",
            maxWidth: "560px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 40px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "36px",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              color: "#ffffff",
              marginBottom: "24px",
            }}
          >
            Check Your Email
          </h1>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: "16px",
            }}
          >
            We sent a magic link to
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "16px",
              color: "#ffffff",
              marginBottom: "40px",
            }}
          >
            {email}
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
            }}
          >
            Click the link in your email to access your dashboard. The link expires in 15 minutes.
          </p>
          <button
            onClick={() => setMode("login")}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginTop: "48px",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            Back to login
          </button>
        </section>
        <Footer />
      </div>
    );
  }

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
          {mode === "login" ? "Welcome Back" : "Create Account"}
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
          {mode === "login"
            ? "Sign in with your email to access your project dashboard."
            : "Enter your invite token and email to set up your account."}
        </p>

        <button
          onClick={googleLogin}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            color: "#ffffff",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "100px",
            padding: "14px 0",
            cursor: "pointer",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "32px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 500,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.3)",
          }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Invite Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your invite token"
                style={inputStyle}
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
                Your project lead will provide this token when your project kicks off.
              </p>
            </div>
          )}

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

          <button
            type="submit"
            disabled={submitting}
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
              padding: "16px 0",
              cursor: submitting ? "not-allowed" : "pointer",
              width: "100%",
              transition: "opacity 0.2s ease",
              opacity: submitting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.opacity = "1"; }}
          >
            {submitting ? "Sending..." : mode === "login" ? "Send Magic Link" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "40px" }}>
          {mode === "login" ? (
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              First time here?{" "}
              <button
                onClick={() => setMode("register")}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#ffffff",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#ffffff",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
