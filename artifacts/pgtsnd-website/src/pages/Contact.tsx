import { useState, useEffect, useRef, useCallback } from "react";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";
import Header from "../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const onScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    setProgress(p);
  }, [ref]);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);
  return progress;
}

const serviceOptions = [
  { id: "film", label: "Film & Video Production" },
  { id: "brand", label: "Brand & Marketing" },
  { id: "photo", label: "Photography" },
  { id: "web", label: "Web Design & Development" },
  { id: "strategy", label: "Digital Strategy" },
  { id: "apply", label: "Apply to Work With Us" },
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
  const imageRef = useRef<HTMLElement>(null);
  const scrollProgress = useScrollProgress(imageRef);

  const translateX = scrollProgress * 80;
  const translateY = scrollProgress * -50;

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 400,
    fontSize: "15px",
    color: "#ffffff",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    padding: "14px 0",
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
      `Phone: ${formData.phone}`,
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
          <div style={{ maxWidth: "800px" }}>
            <h1 style={f({ fontWeight: 900, fontSize: "clamp(48px, 7vw, 84px)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, color: "#ffffff", marginBottom: "40px", whiteSpace: "nowrap" })}>
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
        </section>

        {/* Full-Width Hero Image with Scroll Slide Effect */}
        <section
          ref={imageRef}
          style={{ position: "relative", overflow: "visible" }}
        >
          <div style={{ overflow: "hidden" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/about/pgtsnd-eagle-bri-dwyer.jpeg`}
              alt="Alaska wilderness"
              style={{
                width: "110%",
                height: "45vh",
                objectFit: "cover",
                display: "block",
                marginLeft: "-5%",
                transform: `translate(${translateX}px, ${translateY}px) scale(1.05)`,
                transition: "transform 0.1s linear",
              }}
            />
          </div>
          <div style={{ position: "absolute", top: "-60px", right: "20px", zIndex: 10 }}>
            <ScrollBadge position="bottom-right" inline />
          </div>
        </section>

        {/* Form + What to Expect */}
        <section style={{ padding: "120px 80px 200px" }}>
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
                  <div style={{ marginBottom: "32px" }}>
                    <label style={labelStyle}>Name</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <span style={{ ...labelStyle, fontSize: "11px", marginBottom: "4px" }}>
                          First Name <span style={requiredMark}>(required)</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          style={inputStyle}
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
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "32px" }}>
                    <label style={labelStyle}>
                      Email <span style={requiredMark}>(required)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "32px" }}>
                    <label style={labelStyle}>Phone <span style={requiredMark}>*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: "32px" }}>
                    <label style={labelStyle}>What are you looking for?</label>
                    <select
                      value={selectedService || ""}
                      onChange={(e) => setSelectedService(e.target.value || null)}
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        WebkitAppearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0 center",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" style={{ background: "#000" }}>Select a service</option>
                      {serviceOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} style={{ background: "#000" }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "40px" }}>
                    <label style={labelStyle}>
                      What can we help you create? <span style={requiredMark}>(required)</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{ ...inputStyle, resize: "vertical", display: "block", borderBottom: "1px solid rgba(255,255,255,0.3)" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "14px 36px",
                        border: "2px solid #ffffff",
                        borderRadius: "999px",
                        background: "#ffffff",
                        color: "#000000",
                        cursor: "pointer",
                        ...f({ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }),
                      }}
                    >
                      Submit
                    </button>
                    <a
                      href="https://calendly.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "14px 36px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderRadius: "999px",
                        background: "transparent",
                        color: "#ffffff",
                        cursor: "pointer",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        ...f({ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }),
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Book a Call
                    </a>
                  </div>
                </form>
              )}
            </div>

            {/* What to Expect */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: "60px" }}>
              <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 42px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "40px" })}>
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
              <p style={f({ fontWeight: 400, fontSize: "10px", color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginTop: "32px", maxWidth: "420px" })}>
                By calling or texting PGTSND Productions, you agree to receive text messages related to your inquiry, including follow-ups to missed calls. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out and HELP for assistance.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
