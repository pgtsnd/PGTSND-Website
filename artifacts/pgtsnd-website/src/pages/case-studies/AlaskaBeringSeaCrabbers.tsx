import { useState } from "react";
import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = [
  ["Strategy", "Social Media Management"],
  ["Website", "Social Media Content Creation"],
  ["Photography", "Graphic Design"],
  ["Video Production", ""],
];

const galleryImages = [
  "/images/case-studies/absc/pgtsnd-ABSC-photography-5.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-1.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-7.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-2.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-8.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-4.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-6.jpeg",
  "/images/case-studies/absc/pgtsnd-ABSC-photography-3.jpg",
];

const socialGraphics = [
  "/images/case-studies/absc/absc-social-graphics-gif-pgtsnd-1.gif",
  "/images/case-studies/absc/absc-social-graphics-gif-pgtsnd-2.gif",
  "/images/case-studies/absc/absc-social-graphics-gif-pgtsnd-3.gif",
];

const socialLinks = [
  { label: "ABSC Website", href: "https://www.alaskaberingseacrabbers.org" },
  { label: "ABSC Facebook", href: "https://www.facebook.com/AlaskaBeringSea" },
  { label: "ABSC Instagram", href: "https://www.instagram.com/alaskaberingseacrabbers" },
  { label: "ABSC YouTube", href: "https://youtube.com/@alaskaberingseacrabbers" },
];

function VideoPlaceholder({ thumbnail, duration }: { thumbnail: string; duration: string }) {
  return (
    <div style={{ position: "relative", background: "#111", aspectRatio: "16 / 9", overflow: "hidden" }}>
      <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="22" viewBox="0 0 18 22" fill="white"><polygon points="0,0 18,11 0,22" /></svg>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "12px", left: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={f({ fontSize: "12px", color: "rgba(255,255,255,0.7)" })}>00:00 / {duration}</span>
      </div>
      <div style={{ position: "absolute", bottom: "12px", right: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </div>
    </div>
  );
}

function WebsiteMockup() {
  const [isScrolled, setIsScrolled] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          border: "2px solid rgba(255,255,255,0.6)",
          height: "370px",
          overflow: "hidden",
          overflowY: "auto",
          position: "relative",
        }}
        onScroll={(e) => {
          setIsScrolled((e.target as HTMLDivElement).scrollTop > 10);
        }}
      >
        <img
          src={"/images/case-studies/absc/ABSC-PGTSND-Web-Design-Sample.webp"}
          alt="ABSC Website Design"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.7)",
          borderRadius: "20px",
          padding: "8px 14px",
          opacity: isScrolled ? 0 : 1,
          transition: "opacity 0.4s",
          pointerEvents: "none",
        }}
      >
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
          <rect x="4" y="0.5" width="8" height="13" rx="4" />
          <line x1="8" y1="4" x2="8" y2="7" />
          <path d="M4 16l4 3.5 4-3.5" />
        </svg>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.8)" }}>
          Scroll to explore
        </span>
      </div>
    </div>
  );
}

export default function AlaskaBeringSeaCrabbers() {
  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "160px 80px 180px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "60px", alignItems: "end" }}>
            <h1 style={f({ fontWeight: 900, fontSize: "clamp(48px, 7vw, 84px)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, color: "#ffffff" })}>
              ABSC X<br />PGTSND
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 60px" }}>
              {services.map(([left, right], i) => (
                <div key={i} style={{ display: "contents" }}>
                  {left && <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {left}</p>}
                  {right && <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {right}</p>}
                  {!right && <p />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hero Video Placeholder + Testimonial */}
        <section style={{ padding: "0 80px", paddingBottom: "120px", position: "relative" }}>
          <div style={{ width: "100%", position: "relative" }}>
            <div style={{ position: "absolute", top: "-55px", left: "0", zIndex: 5 }}>
              <ScrollBadge position="bottom-left" inline />
            </div>
            <div style={{ width: "100%", aspectRatio: "16 / 9", overflow: "visible", position: "relative", background: "#111" }}>
            <img
              src={"/images/case-studies/absc/pgtsnd-ABSC-photography-5.jpeg"}
              alt="Alaska Bering Sea"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block", opacity: 0.8 }}
            />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="22" height="26" viewBox="0 0 18 22" fill="white"><polygon points="0,0 18,11 0,22" /></svg>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "-60px", left: "60px", maxWidth: "440px", zIndex: 2 }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", marginBottom: "-32px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
                <img
                  src={"/images/case-studies/absc/Jamie-Goen-Alaska-Bering-Sea-Crabbers-pgt-snd.jpg"}
                  alt="Jamie Goen"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ border: "2px solid rgba(255,255,255,0.85)", padding: "48px 32px 32px", background: "rgba(0,0,0,0.85)" }}>
                <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "20px" })}>
                  &ldquo;Bri had an amazing vision for how to tell our story from various angles &mdash; showcasing the true grit, hard work, passion, and resilience that are the heart of our industry.&rdquo;
                </p>
                <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                  Jamie Goen, Executive Director at ABSC
                </p>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* The Big Picture */}
        <section style={{ padding: "220px 80px 240px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            The Big Picture
          </h2>
          <div style={{ maxWidth: "560px", marginLeft: "auto" }}>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              Strategy, storytelling, and execution across every channel. This project marked one of our first full-suite campaigns and proved the power of pairing strong, world-building visuals with strategic communication.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              When crab fisheries in the Bering Sea faced closures, the Alaska Bering Sea Crabbers needed vision and a voice to connect with their community. PGTSND supported the association in securing grant funding to build a comprehensive platform that would communicate area closures and amplify the human stories impacted by them.
            </p>
          </div>
        </section>

        {/* Video Placeholders */}
        <section style={{ padding: "0 80px 130px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", position: "relative" }}>
            <VideoPlaceholder
              thumbnail={"/images/case-studies/absc/pgtsnd-ABSC-photography-7.jpeg"}
              duration="05:04"
            />
            <VideoPlaceholder
              thumbnail={"/images/case-studies/absc/pgtsnd-ABSC-photography-2.jpeg"}
              duration="05:02"
            />
            <div style={{ position: "absolute", top: "-64px", right: "16px", zIndex: 2 }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </section>

        {/* The Solve */}
        <section style={{ padding: "160px 80px 230px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <WebsiteMockup />
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "32px" })}>
              The Solve
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              Through brand films, photography, and a complete website revamp, we captured the voices of ABSC and the fishing families at the heart of the industry.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              Our team managed social media, created ongoing content, designed graphics, and delivered the tools ABSC needed to communicate with their community during a time of uncertainty and change.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              Alaska Bering Sea Crabbers is proof of how strategy and storytelling can work hand in hand to serve an industry and the people who depend on it.
            </p>
          </div>
        </section>

        {/* Social Media Graphics */}
        <section style={{ padding: "100px 0 100px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <img
              src={"/images/case-studies/absc/ABSC-200.jpg"}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, filter: "saturate(0.6) brightness(0.4)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "rgba(15, 25, 45, 0.75)" }} />
          </div>
          <div style={{ position: "absolute", top: "24px", right: "40px", zIndex: 3 }}>
            <ScrollBadge position="bottom-right" inline />
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "56px", padding: "0 200px" }}>
            {socialGraphics.map((img, i) => (
              <div key={i} style={{ overflow: "hidden", borderRadius: "4px" }}>
                <img src={img} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            ))}
          </div>
        </section>

        {/* Photo Gallery */}
        <section style={{ padding: "225px 40px 40px" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
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
                  transition: "border-color 0.2s",
                  ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: "200px 80px 200px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "480px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
              <img
                src={"/images/case-studies/absc/Jamie-Goen-Alaska-Bering-Sea-Crabbers-pgt-snd.jpg"}
                alt="Jamie Goen"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "64px 40px 42px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "24px" })}>
                &ldquo;PGTSND Productions was an absolute delight to work with! And their creative vision and execution are truly impressive! Bri and her team caught some epic shots that only true artists can see yet everyone loves to look at. Alaska Bering Sea Crabbers continue to use the video and photo assets years later to share our story with the world.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Jamie Goen, Executive Director at ABSC
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              From sea to skyline, your story deserves to be told right.
            </h2>
            <CTAButton href="/contact" label="Let's Talk" />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
