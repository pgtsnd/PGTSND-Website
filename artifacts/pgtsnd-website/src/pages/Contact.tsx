import { useState } from "react";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "16px",
    color: "#ffffff",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    padding: "12px 0",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
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

  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 32px 80px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          <h1
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(48px, 7vw, 84px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.9,
              color: "#ffffff",
              marginBottom: "32px",
            }}
          >
            Let's Get To Work.
          </h1>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
              marginBottom: "16px",
            }}
          >
            Our clients work hard, and so do we. On the water, in the field, or in our production studio, we'll meet you there and get the job done right.
          </p>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
            }}
          >
            Fill out the form to get started or email us at{" "}
            <a
              href="mailto:hello@pgtsndproductions.com"
              style={{
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              hello@pgtsndproductions.com
            </a>
          </p>
        </div>

        <ScrollBadge position="bottom-right" />
      </section>

      {/* Eagle Image */}
      <section style={{ padding: "0" }}>
        <img
          src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/a4bb4098-6f6b-412f-9f99-da7396dbab92/foggy-fishing-coast-pgtsnd.jpeg"
          alt="A boat on calm water with forested mountains and low-hanging clouds in the background."
          style={{
            width: "100%",
            height: "60vh",
            objectFit: "cover",
            display: "block",
          }}
        />
      </section>

      {/* Form Section */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {submitted ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
            }}
          >
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "48px",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                marginBottom: "16px",
              }}
            >
              We'll be in touch.
            </h2>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Thanks for reaching out. Expect to hear from us within 1-2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "40px",
                marginBottom: "40px",
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyle}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: "40px" }}>
              <label style={labelStyle}>Company / Organization</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={inputStyle}
                placeholder="Your company name"
              />
            </div>

            <div style={{ marginBottom: "60px" }}>
              <label style={labelStyle}>Tell us about your project</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  borderBottom: "1px solid rgba(255,255,255,0.3)",
                  display: "block",
                }}
                placeholder="What are you working on? What does success look like to you?"
              />
            </div>

            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "16px",
                background: "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: "999px",
                padding: "12px 28px 12px 14px",
                color: "#000000",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
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
                  background: "#000000",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
              Send Message
            </button>
          </form>
        )}
      </section>

      <Footer />
    </div>
  );
}
