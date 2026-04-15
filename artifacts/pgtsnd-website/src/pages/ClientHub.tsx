import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ClientHub() {
  const [mode, setMode] = useState<"login" | "register" | "check-email">("login");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMode("check-email");
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

          <div style={{ marginBottom: "48px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
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
            {mode === "login" ? "Send Magic Link" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "48px", textAlign: "center" }}>
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
