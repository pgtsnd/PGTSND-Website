import { useState } from "react";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";
import Header from "../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const serviceOptions = [
  { id: "film", label: "Film & Video Production" },
  { id: "brand", label: "Brand & Marketing" },
  { id: "photo", label: "Photography" },
  { id: "other", label: "Something Else" },
];

const expectations = [
  { bold: "Quick reply", rest: ": We'll confirm receipt within 3 business days to set up a call." },
  { bold: "Clarity first", rest: ": We'll ask about your goals, timeline, and key details upfront." },
  { bold: "Respect for protocols", rest: ": If there are site requirements, safety rules, or permissions to consider, we'll build them into the plan." },
  { bold: "Tailored scope", rest: ": You'll get a clear proposal sized to your needs and budget." },
];

export default function Contact() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    website: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "15px",
    color: "#ffffff",
    background: "#ffffff",
    border: "none",
    padding: "14px 16px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 500,
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
    display: "block",
    marginBottom: "6px",
  };

  const requiredMark: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
    marginLeft: "6px",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = selectedService
      ? `New Inquiry: ${serviceOptions.find((s) => s.id === selectedService)?.label}`
      : "New Contact Form Submission";
    const body = [
      `Name: ${formData.firstName} ${formData.lastName}`,
      `Email: ${formData.email}`,
      formData.phone ? `Phone: ${formData.phone}` : "",
      formData.website ? `Website: ${formData.website}` : "",
      selectedService ? `Service: ${serviceOptions.find((s) => s.id === selectedService)?.label}` : "",
      "",
      `Message:`,
      formData.message,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:hello@pgtsndproductions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "160px 80px 120px", position: "relative" }}>
          <div style={{ maxWidth: "520px" }}>
            <h1 style={f({ fontWeight: 900, fontSize: "clamp(48px, 7vw, 84px)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, color: "#ffffff", marginBottom: "40px", fontStyle: "italic" })}>
              Let's Get To Work.
            </h1>
            <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              Our clients work hard, and so do we. On the water, in the field, or in our production studio, we'll meet you there and get the job done right.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              Fill out the form to get started or email us at{" "}
              <a
                href="mailto:hello@pgtsndproductions.com"
                style={{ color: "#ffffff", fontWeight: 600, textDecoration: "none" }}
              >
                hello@pgtsndproductions.com
              </a>
            </p>
          </div>
          <ScrollBadge position="bottom-right" />
        </section>

        {/* Full-Width Hero Image with Scroll Effect */}
        <section style={{ padding: "0 40px 0", position: "relative" }}>
          <div style={{ overflow: "hidden", position: "relative" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/2024_BRI_DWYER-02064.jpg`}
              alt="Alaska wilderness"
              style={{ width: "100%", height: "40vh", objectFit: "cover", objectPosition: "center 30%", display: "block" }}
            />
            <div style={{ position: "absolute", top: "20px", right: "20px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </section>

        {/* Service Selector Tabs */}
        <section style={{ padding: "120px 80px 0" }}>
          <h2 style={f({ fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: "24px" })}>
            What are you looking for?
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "60px" }}>
            {serviceOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedService(selectedService === opt.id ? null : opt.id)}
                style={{
                  padding: "12px 28px",
                  borderRadius: "999px",
                  border: selectedService === opt.id ? "2px solid #ffffff" : "2px solid rgba(255,255,255,0.25)",
                  background: selectedService === opt.id ? "#ffffff" : "transparent",
                  color: selectedService === opt.id ? "#000000" : "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  ...f({ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }),
                }}
              >
                {opt.label}
              </button>
            ))}
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 28px",
                borderRadius: "999px",
                border: "2px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                ...f({ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }),
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book a Discovery Call
            </a>
          </div>
        </section>

        {/* Form + What to Expect */}
        <section style={{ padding: "0 80px 200px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "120px", alignItems: "start" }}>
            {/* Form */}
            <div>
              {submitted ? (
                <div style={{ padding: "60px 0" }}>
                  <h3 style={f({ fontWeight: 900, fontSize: "28px", textTransform: "uppercase", color: "#ffffff", marginBottom: "16px" })}>
                    Message Sent.
                  </h3>
                  <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.8 })}>
                    We'll be in touch within 3 business days to set up a call.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "28px" }}>
                    <label style={labelStyle}>Name</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <span style={{ ...labelStyle, fontSize: "11px", marginBottom: "4px" }}>
                          First Name <span style={requiredMark}>(required)</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          style={{ ...inputStyle, color: "#000000" }}
                        />
                      </div>
                      <div>
                        <span style={{ ...labelStyle, fontSize: "11px", marginBottom: "4px" }}>
                          Last Name <span style={requiredMark}>(required)</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          style={{ ...inputStyle, color: "#000000" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "28px" }}>
                    <label style={labelStyle}>
                      Email <span style={requiredMark}>(required)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ ...inputStyle, color: "#000000" }}
                    />
                  </div>

                  <div style={{ marginBottom: "28px" }}>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ ...inputStyle, color: "#000000" }}
                    />
                  </div>

                  <div style={{ marginBottom: "28px" }}>
                    <label style={labelStyle}>Website</label>
                    <input
                      type="url"
                      placeholder="http://"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      style={{ ...inputStyle, color: "#000000" }}
                    />
                  </div>

                  <div style={{ marginBottom: "40px" }}>
                    <label style={labelStyle}>
                      What can we help you create? <span style={requiredMark}>(required)</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{ ...inputStyle, color: "#000000", resize: "vertical", display: "block" }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: "14px 36px",
                      border: "2px solid #ffffff",
                      borderRadius: "999px",
                      background: "transparent",
                      color: "#ffffff",
                      cursor: "pointer",
                      ...f({ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }),
                    }}
                  >
                    Submit
                  </button>
                </form>
              )}
            </div>

            {/* What to Expect */}
            <div style={{ borderLeft: "2px solid rgba(255,255,255,0.2)", paddingLeft: "60px" }}>
              <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 42px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "40px", fontStyle: "italic" })}>
                What to Expect
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {expectations.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={f({ fontSize: "15px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8 })}>&#8226;</span>
                    <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.8 })}>
                      <strong style={{ fontWeight: 700, color: "#ffffff" }}>{item.bold}</strong>
                      {item.rest}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
