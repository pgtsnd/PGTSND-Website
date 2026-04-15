import { useState } from "react";
import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const SQ = "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5";

const services = [
  ["Strategy", "Graphic Design"],
  ["Brand Development", "Social Media Management"],
  ["Logo Design", "Social Media Content Creation"],
  ["Website Design", ""],
];

const galleryImages = [
  `${SQ}/2b467b4e-c589-4307-9467-83d43335b25e/nw-sablefish-pgtsnd-photography-2.JPG`,
  `${SQ}/30ed6117-3506-43a2-95c2-ea5e9488664f/nw-sablefish-pgtsnd-photography-4.jpg`,
  `${SQ}/93006ba2-8cb2-4602-994e-d06460bddefb/nw-sablefish-pgtsnd-photography-7.jpeg`,
  `${SQ}/9418b4da-9a64-4271-b863-1fcb42572e1c/nw-sablefish-pgtsnd-photography-9.JPG`,
  `${SQ}/c647e711-0513-486e-9838-da5fab65a4bf/nw-sablefish-pgtsnd-photography-3.jpg`,
  `${SQ}/46196bcd-86d8-4ae1-a37a-2c48c3d37a14/nw-sablefish-pgtsnd-photography-8.jpg`,
];

const socialLinks = [
  { label: "Visit Instagram", href: "https://www.instagram.com/nw_sablefish" },
  { label: "Visit Website", href: "https://www.nwsablefish.com" },
];

const brandColors = [
  { color: "#2d6a6f", border: "none" },
  { color: "#b0b0a8", border: "3px solid rgba(255,255,255,0.4)" },
  { color: "#c5a44e", border: "none" },
];

function PhoneMockup({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: "220px", borderRadius: "28px", overflow: "hidden", border: "4px solid rgba(0,0,0,0.8)", background: "#111", flexShrink: 0, ...style }}>
      <div style={{ padding: "6px 0 0", background: "#000", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "80px", height: "18px", borderRadius: "0 0 12px 12px", background: "#111" }} />
      </div>
      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
    </div>
  );
}

function VideoPlaceholder({ thumbnail, duration }: { thumbnail: string; duration: string }) {
  return (
    <div style={{ position: "relative", background: "#111", aspectRatio: "16 / 9", overflow: "hidden" }}>
      <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="22" viewBox="0 0 18 22" fill="white"><polygon points="0,0 18,11 0,22" /></svg>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "12px", left: "16px" }}>
        <span style={f({ fontSize: "12px", color: "rgba(255,255,255,0.7)" })}>00:00 / {duration}</span>
      </div>
    </div>
  );
}

export default function NWSablefish() {
  const [webHovered, setWebHovered] = useState(false);

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "140px 80px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
            <div>
              <h1 style={f({ fontWeight: 900, fontSize: "clamp(48px, 6vw, 76px)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, color: "#ffffff", marginBottom: "48px" })}>
                NW Sablefish<br />X PGTSND
              </h1>
            </div>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 60px" }}>
                {services.map(([left, right], i) => (
                  <div key={i} style={{ display: "contents" }}>
                    <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {left}</p>
                    {right && <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {right}</p>}
                    {!right && <p />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Topo background at bottom of hero */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", overflow: "hidden", pointerEvents: "none" }}>
            <img
              src={`${SQ}/4008209d-9f29-48a0-94f1-0b7cd95b6c1c/sablefish-topo-blue2+%281%29.png`}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: 0.4 }}
            />
          </div>
        </section>

        {/* Brand Identity Mockups - Full Width Hero */}
        <section style={{ padding: "0 40px 40px" }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={`${SQ}/b24b005a-f922-48e9-adae-3fcbf9c75d17/pgtsnd-nw-sablefish-brand-identity-mockups.png`}
              alt="NW Sablefish Brand Identity Mockups"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </section>

        {/* Fish Tail + Color Palette + Testimonial */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={`${SQ}/84f78130-4f80-4f34-bef0-2a50f376afd7/pgtsnd-fish-tail-nw-sablefish.jpg`}
              alt="Sablefish on Ice"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* Color Palette Circles */}
            <div style={{ position: "absolute", top: "40px", left: "60px", display: "flex", gap: "0" }}>
              {brandColors.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: c.color,
                    border: c.border,
                    marginLeft: i > 0 ? "-10px" : "0",
                    zIndex: 3 - i,
                  }}
                />
              ))}
            </div>
            {/* Gold Fish Icon */}
            <div style={{ position: "absolute", top: "30px", right: "60px" }}>
              <img
                src={`${SQ}/a37a20d0-69f0-4978-9558-53bc5ead5e7f/NWsablefish-fish-gold.png`}
                alt="NW Sablefish Logo"
                style={{ width: "80px", height: "auto" }}
              />
            </div>
            {/* Testimonial Card */}
            <div style={{ position: "absolute", bottom: "40px", right: "60px", maxWidth: "420px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", position: "relative", zIndex: 3, border: "3px solid #000" }}>
                <img
                  src={`${SQ}/4d53ebb7-4229-4ee2-bdc4-72340741072f/katie-harris-headshot-pgtsnd-testimonial.jpg`}
                  alt="Katie Harris"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ border: "2px solid rgba(255,255,255,0.3)", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
                <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "16px" })}>
                  &ldquo;PGTSND was an integral part of our campaign, helping us craft a compelling brand narrative and producing media assets that far exceeded our expectations.&rdquo;
                </p>
                <p style={f({ fontWeight: 700, fontSize: "12px", color: "#ffffff" })}>
                  Katie Harris, Grants, Outreach &amp; Operations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Identity Guide + The Big Picture */}
        <section style={{ padding: "80px 80px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <div style={{ position: "relative" }}>
            <div style={{ background: "#ffffff", borderRadius: "4px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
              <img
                src={`${SQ}/cb796e45-9ea0-4aca-82a3-1b2731646233/nw-sablefish-identity-guide-pgtsndpdf.png`}
                alt="NW Sablefish Identity Guide"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <img
              src={`${SQ}/f512947b-c151-4c55-b1b5-e7cd77b5ed6e/NWsablefish-arrow-gold.png`}
              alt=""
              style={{ position: "absolute", bottom: "-20px", right: "-10px", width: "50px", height: "auto", transform: "rotate(15deg)" }}
            />
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "32px" })}>
              The Big Picture
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              North West Sablefish came to PGTSND with a goal to set their product apart in a crowded market and give it the premium presence it deserved.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              Our team built the brand from the ground up, creating a logo, brand guide, and an aligned suite of digital platforms that framed their sablefish as both distinctive and versatile.
            </p>
          </div>
        </section>

        {/* Social Media Phones on Topo Background */}
        <section style={{ padding: "0 40px 0", position: "relative" }}>
          <div style={{
            background: "#2d6a6f",
            borderRadius: "8px",
            padding: "60px 40px",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
              <img
                src={`${SQ}/4008209d-9f29-48a0-94f1-0b7cd95b6c1c/sablefish-topo-blue2+%281%29.png`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <PhoneMockup
              src={`${SQ}/2b467b4e-c589-4307-9467-83d43335b25e/nw-sablefish-pgtsnd-photography-2.JPG`}
              style={{ transform: "translateY(10px)", zIndex: 1 }}
            />
            <PhoneMockup
              src={`${SQ}/c647e711-0513-486e-9838-da5fab65a4bf/nw-sablefish-pgtsnd-photography-3.jpg`}
              style={{ transform: "translateY(-10px)", zIndex: 2 }}
            />
            <PhoneMockup
              src={`${SQ}/46196bcd-86d8-4ae1-a37a-2c48c3d37a14/nw-sablefish-pgtsnd-photography-8.jpg`}
              style={{ transform: "translateY(10px)", zIndex: 1 }}
            />
          </div>
        </section>

        {/* ScrollBadge + Instagram Button */}
        <section style={{ padding: "40px 40px 80px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <ScrollBadge position="bottom-left" bottomOffset={-58} />
          <a
            href="https://www.instagram.com/nw_sablefish"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 48px",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: "999px",
              textDecoration: "none",
              ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
            }}
          >
            NW Sablefish Instagram
          </a>
        </section>

        {/* Website Mockup + The Solve */}
        <section style={{ padding: "0 80px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onMouseEnter={() => setWebHovered(true)}
              onMouseLeave={() => setWebHovered(false)}
            >
              <img
                src={`${SQ}/bd8c08da-74fd-4f9f-847f-3b3661605642/nw-sablefish-website-design-pgtsnd.jpeg`}
                alt="NW Sablefish Website"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px", border: "2px solid rgba(255,255,255,0.15)" }}
              />
              <img
                src={`${SQ}/f512947b-c151-4c55-b1b5-e7cd77b5ed6e/NWsablefish-arrow-gold.png`}
                alt=""
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "-10px",
                  width: "40px",
                  height: "auto",
                  opacity: webHovered ? 1 : 0.85,
                  transition: "opacity 0.3s",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "32px" })}>
              The Solve
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              To bring this story to life, we partnered with Pacific Northwest chefs to produce high-quality brand films and photography that showcased sablefish in their restaurants. Each dish highlighted the adaptability and value of the product as a premium ingredient, while the chefs' own voices added authenticity and connection.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              PGTSND delivered a full suite of assets that carried the brand from launch and into steady audience growth.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              We built their social presence from zero into a growing community, establishing a foundation for awareness and storytelling that positioned North West Sablefish as both a high-value product and as an experience worth savoring.
            </p>
          </div>
        </section>

        {/* Fish Sticker + ScrollBadge */}
        <section style={{ padding: "0 80px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img
            src={`${SQ}/a37a20d0-69f0-4978-9558-53bc5ead5e7f/NWsablefish-fish-gold.png`}
            alt="NW Sablefish"
            style={{ width: "60px", height: "auto" }}
          />
          <ScrollBadge position="bottom-right" inline />
        </section>

        {/* Photo Gallery */}
        <section style={{ padding: "20px 40px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {galleryImages.map((img, i) => (
              <div key={i} style={{ overflow: "hidden", aspectRatio: "4 / 3" }}>
                <img
                  src={img}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Social Links */}
        <section style={{ padding: "40px 80px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 24px",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderRadius: "999px",
                  textDecoration: "none",
                  ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: "80px 80px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "440px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", position: "relative", zIndex: 3, border: "3px solid #000" }}>
              <img
                src={`${SQ}/4d53ebb7-4229-4ee2-bdc4-72340741072f/katie-harris-headshot-pgtsnd-testimonial.jpg`}
                alt="Katie Harris"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid rgba(255,255,255,0.3)", padding: "44px 28px 28px" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "16px" })}>
                &ldquo;Bri was so easy to communicate with, helping find creative solutions that fit within our budget and delivering every project on time with consistently high-quality results. We're thrilled with our new marketing platform and are excited to work with PGTSND Productions again in the future!&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "12px", color: "#ffffff" })}>
                Katie Harris, Grants, Outreach &amp; Operations
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Real work, real impact, and visuals that prove it.
            </h2>
            <CTAButton href="/contact" label="Let's Get to Work" />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
