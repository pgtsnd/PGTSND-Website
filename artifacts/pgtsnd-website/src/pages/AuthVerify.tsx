import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth, getDashboardPath } from "../lib/auth";
import { consumePostLoginRedirect } from "../lib/session-expired";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AuthVerify() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { verifyMagicLink, user } = useAuth();
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");

    if (!token) {
      setError("No verification token found");
      setVerifying(false);
      return;
    }

    verifyMagicLink(token).then((result) => {
      if (result.success) {
        const saved = consumePostLoginRedirect();
        navigate(saved || result.redirect || "/");
      } else {
        setError(result.error || "Verification failed");
        setVerifying(false);
      }
    });
  }, [search, verifyMagicLink, navigate]);

  useEffect(() => {
    if (user && !verifying) {
      navigate(getDashboardPath(user.role));
    }
  }, [user, verifying, navigate]);

  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      <Header />
      <section
        style={{
          paddingTop: "200px",
          paddingBottom: "200px",
          maxWidth: "560px",
          margin: "0 auto",
          textAlign: "center",
          padding: "200px 80px",
        }}
      >
        {verifying ? (
          <>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "36px",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: "24px",
              }}
            >
              Verifying...
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Please wait while we verify your login link.
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "36px",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: "24px",
              }}
            >
              Verification Failed
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "#ff6b6b",
                marginBottom: "40px",
              }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate("/client-hub")}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              Back to login
            </button>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}
