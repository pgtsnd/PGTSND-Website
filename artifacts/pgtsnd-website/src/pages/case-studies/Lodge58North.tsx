import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = ["Video Production", "Photography"];

const galleryImages = [
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-1.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-2.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-3.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-4.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-5.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-6.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-7.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-8.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-9.jpeg",
  "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-10.jpeg",
];

const socialLinks = [
  { label: "Visit Instagram", href: "https://www.instagram.com/lodgeat58north" },
  { label: "Visit Website", href: "https://www.lodgeat58north.com" },
  { label: "Visit YouTube", href: "https://www.youtube.com/@lodgeat58north" },
];

export default function Lodge58North() {
  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "160px 80px 180px", textAlign: "center" }}>
          <h1 style={f({ fontWeight: 900, fontSize: "clamp(36px, 5vw, 64px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
            Lodge @ 58 North X PGTSND
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {services.map((s) => (
              <p key={s} style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>&#183; {s}</p>
            ))}
          </div>
        </section>

        {/* Panoramic Hero Image */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <ScrollBadge position="bottom-right" bottomOffset={-58} />
          <div style={{ overflow: "hidden", aspectRatio: "21 / 9" }}>
            <img
              src={galleryImages[0]}
              alt="Lodge @ 58 North - Aerial View"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </section>

        {/* Video Placeholder - Aerial Shot */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9" }}>
            <img
              src={galleryImages[9]}
              alt="Bristol Bay Alaska"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="24" viewBox="0 0 18 22" fill="white"><polygon points="0,0 18,11 0,22" /></svg>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", top: "20px", right: "60px" }}>
            <ScrollBadge position="bottom-right" inline />
          </div>
        </section>

        {/* Inside Our Partnership */}
        <section style={{ padding: "220px 80px 240px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            Inside Our Partnership
          </h2>
          <div style={{ maxWidth: "560px", marginLeft: "auto" }}>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              From still images to cinematic storytelling. What started as a single project grew into a trusted partnership with owners Kate and Justin as they expanded their lodge and their vision.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              Our relationship with Lodge @ 58 North began documenting the sport fishing experience through photography set against the wild beauty of Bristol Bay.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              When the new lodge was completed, PGTSND evolved the story with them. We returned to capture a fresh suite of photography and produced a brand film in partnership with our friends at <a href="#" style={{ color: "#ffffff", textDecoration: "underline" }}>Topo Films</a> that showcases both the modern design of the lodge and the people behind it.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              This ongoing collaboration has given Lodge @ 58 North a visual foundation to share their story and connect their audience to the unique experience they've created in Bristol Bay.
            </p>
          </div>
        </section>

        {/* Photo Gallery */}
        <section style={{ padding: "0 40px 40px" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
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
        <section style={{ padding: "200px 80px 200px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "480px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
              <img
                src={galleryImages[4]}
                alt="Kate Crump"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "64px 40px 42px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "24px" })}>
                &ldquo;PGTSND Productions has always been so professional and fun to work with in the last five years. The quality of people are outstanding and the work is always exceptional and timely. We are very proud to partner with Bri at PGT.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Kate Crump, Lodge at 58 North
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 4.5vw, 52px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              You're already doing the hard work. We'll make sure people see why it matters.
            </h2>
            <div style={{ marginTop: "10px" }}>
              <CTAButton href="/contact" label="Work With Us" />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
