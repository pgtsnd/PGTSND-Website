import { useState, useEffect, useRef } from "react";
import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});



const services = [
  ["Strategy", "Email Marketing"],
  ["Social Media Management", "Graphic Design"],
  ["Social Content Creation", "Photography"],
  ["Website", "Copywriting"],
];

const socialGraphics = [
  "/images/case-studies/green-juju/dog-facts-green-juju-pgtsnd-carousel-1.gif",
  "/images/case-studies/green-juju/seasons-green-juju-pgtsnd-carousel.gif",
];

const galleryImages = [
  "/images/case-studies/green-juju/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg",
  "/images/case-studies/green-juju/green-juju-dog-kitchen-pgtsnd.jpeg",
  "/images/case-studies/green-juju/green-juju-ingredientspgtsnd-photography.jpeg",
  "/images/case-studies/green-juju/pets-green-juju-pgtsnd-bri-dwyer.jpeg",
  "/images/case-studies/green-juju/green-juju-supplements-close-pgtsnd.jpeg",
  "/images/case-studies/green-juju/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg",
  "/images/case-studies/green-juju/puppies-green-juju-pgtsnd.jpeg",
  "/images/case-studies/green-juju/green-juju-vitality-blend-pgtsnd.jpeg",
];

const socialLinks = [
  { label: "Green Juju Website", href: "https://www.greenjuju.com" },
  { label: "Green Juju Facebook", href: "https://www.facebook.com/feedgreenjuju" },
  { label: "Green Juju Instagram", href: "https://www.instagram.com/greenjuju" },
];

const partnershipResults = [
  { bold: "Thousands of new followers", rest: " in under a year" },
  { bold: "Engagement rates", rest: " climbing steadily month over month" },
  { bold: "", rest: "Link clicks ", boldInline: "up by double digits,", restEnd: " directly driving sales" },
];

const stats = [
  { value: "8%", desc: "increase in online sales 60 days after launch" },
  { value: "14%", desc: "increase in clicks through social media since launching new content" },
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
      <div style={{ position: "absolute", bottom: "12px", left: "16px" }}>
        <span style={f({ fontSize: "12px", color: "rgba(255,255,255,0.7)" })}>00:00 / {duration}</span>
      </div>
      <div style={{ position: "absolute", bottom: "12px", right: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </div>
    </div>
  );
}

function PhoneMockup({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <div style={{ width: "200px", borderRadius: "24px", overflow: "hidden", border: "3px solid rgba(255,255,255,0.15)", background: "#111", flexShrink: 0, ...style }}>
      <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", gap: "6px", background: "#1a1a1a" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
        <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} />
      </div>
      <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
    </div>
  );
}

function VideoPhoneMockup({ poster, style }: { poster?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: "220px",
        aspectRatio: "9 / 19",
        borderRadius: "32px",
        overflow: "hidden",
        border: "8px solid #111",
        boxShadow: "0 0 0 2px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.5)",
        background: "#1a1a1a",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80px",
          height: "20px",
          background: "#111",
          borderRadius: "0 0 12px 12px",
          zIndex: 3,
        }}
      />
      {poster ? (
        <img
          src={poster}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(60%) brightness(0.55)" }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)" }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            border: "2px solid rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg width="20" height="24" viewBox="0 0 18 22" fill="white">
            <polygon points="0,0 18,11 0,22" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function GreenJuju() {
  const [webHovered, setWebHovered] = useState(false);

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "160px 80px 180px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
            <div>
              <h1 style={f({ fontWeight: 900, fontSize: "clamp(48px, 6vw, 76px)", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95, color: "#ffffff", marginBottom: "48px", whiteSpace: "nowrap" })}>
                Green Juju X<br />PGTSND
              </h1>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 60px" }}>
                {services.map(([left, right], i) => (
                  <div key={i} style={{ display: "contents" }}>
                    <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {left}</p>
                    <p style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2.2 })}>&#183; {right}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "24px", minHeight: "400px" }}>
              <img
                src={"/images/case-studies/green-juju/dog-facts-green-juju-pgtsnd-carousel-1.gif"}
                alt="Green Juju dog facts Instagram post"
                style={{ width: "240px", height: "auto", display: "block", transform: "translateY(-20px)", flexShrink: 0 }}
              />
              <img
                src={"/images/case-studies/green-juju/seasons-green-juju-pgtsnd-carousel.gif"}
                alt="Green Juju seasons Instagram post"
                style={{ width: "240px", height: "auto", display: "block", transform: "translateY(-20px)", flexShrink: 0 }}
              />
            </div>
          </div>
        </section>

        {/* Social Media Showcase */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <ScrollBadge position="bottom-left" bottomOffset={857} />
          <div
            style={{
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
              aspectRatio: "16 / 9",
              backgroundImage: `url("/images/case-studies/green-juju/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg")`,
              backgroundSize: "125%",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(82,140,130,0.55)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                gap: "40px",
                padding: "40px 80px",
              }}
            >
              <VideoPhoneMockup
                poster={"/images/case-studies/green-juju/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg"}
              />
              <VideoPhoneMockup
                poster={"/images/case-studies/green-juju/green-juju-supplements-close-pgtsnd.jpeg"}
              />
              <VideoPhoneMockup
                poster={"/images/case-studies/green-juju/puppies-green-juju-pgtsnd.jpeg"}
              />
            </div>
            <div style={{ position: "absolute", bottom: "20px", right: "20px", zIndex: 2 }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "40px" }}>
            <img
              src={"/images/case-studies/green-juju/dog-with-treats-green-juju-pgtsnd.png"}
              alt="Dog with Green Juju treats"
              style={{ width: "180px", height: "auto", marginTop: "-140px", position: "relative", zIndex: 2 }}
            />
            <a
              href="https://www.instagram.com/greenjuju"
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
              Green Juju Instagram
            </a>
          </div>
        </section>

        {/* The Big Picture */}
        <section style={{ padding: "220px 80px 240px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            The Big Picture
          </h2>
          <div style={{ maxWidth: "560px", marginLeft: "auto" }}>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              PGTSND's partnership with Green Juju is full-spectrum storytelling in action.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              Green Juju came to PGTSND looking for a creative partner who could match their ambition and amplify their reach. Since 2024, we've become a full-spectrum extension of their team, trusted to creatively shape everything from daily social content to long-term brand strategy.
            </p>
          </div>
        </section>

        {/* Product Tubs + Testimonial */}
        <section style={{ padding: "0 80px 120px", position: "relative" }}>
          <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
            <img
              src={"/images/case-studies/green-juju/green-juju-snack-cutout-pgtsnd.png"}
              alt="Green Juju product containers"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div style={{ position: "absolute", bottom: "20px", right: "20px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
          <div style={{ maxWidth: "400px", position: "relative", marginTop: "-60px", marginLeft: "60px", zIndex: 2 }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
              <img
                src={"/images/case-studies/green-juju/kelly-green-juju.webp"}
                alt="Kelley Mirian"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "16px" })}>
                &ldquo;Bri and her team have completely transformed our digital presence.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Kelley Mirian, Founder at Green Juju
              </p>
            </div>
          </div>
        </section>

        {/* The Solve */}
        <section style={{ padding: "160px 80px 230px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <div>
            <div
              style={{ position: "relative", cursor: "pointer", marginBottom: "24px" }}
              onMouseEnter={() => setWebHovered(true)}
              onMouseLeave={() => setWebHovered(false)}
            >
              <div
                style={{
                  height: "420px",
                  overflowY: "auto",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "#000",
                }}
              >
                <img
                  src={"/images/case-studies/green-juju/green-juju-web-design-pgtsnd-screen-capture.jpeg"}
                  alt="Green Juju Website"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <img
                src={"/images/case-studies/green-juju/juju-cursor-case-study.png"}
                alt=""
                style={{
                  position: "absolute",
                  top: "25%",
                  right: "20%",
                  width: "50px",
                  height: "auto",
                  opacity: webHovered ? 1 : 0.85,
                  transition: "opacity 0.3s",
                  pointerEvents: "none",
                }}
              />
            </div>
            <a
              href="https://www.greenjuju.com"
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
                width: "100%",
                ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
              }}
            >
              Visit the Website
            </a>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "32px" })}>
              The Solve
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              We reimagined their website to become the homebase hub that sets the example and built out email marketing campaigns to nurture loyal customers.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              Each piece we create ties back to a core narrative: Green Juju is about real food, real results, and healthier, happier pets.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              In strategy and execution, we work as an extension of Green Juju's team, demonstrating how integrated storytelling can transform a brand, and how our approach strengthens business impact.
            </p>
          </div>
        </section>

        {/* Full Production Suite + */}
        <section style={{ padding: "0 80px 180px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "80px", alignItems: "start" }}>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, color: "#ffffff", marginBottom: "32px" })}>
              Full Production Suite +
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              We began with photo and video production, building a library of lifestyle and product visuals that showcased Green Juju's unique place in the pet food market.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              Our role expanded to copywriting, blogs, website content, and product descriptions, delivered in a consistent voice that balances education, trust, and warmth.
            </p>
          </div>
          <div>
            <div
              style={{
                height: "560px",
                overflowY: "auto",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "#000",
                marginBottom: "16px",
              }}
            >
              <img
                src={"/images/case-studies/green-juju/green-juju-blog-post-pgtsnd-productions.jpg"}
                alt="Green Juju Blog Post"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <a
              href="https://www.greenjuju.com/blog"
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
                width: "100%",
                ...f({ fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#ffffff" }),
              }}
            >
              Read a Post
            </a>
          </div>
        </section>

        {/* Veggie Horizontal Scroll Bar */}
        <VeggieScrollBar />

        {/* Partnership Results */}
        <section style={{ padding: "220px 80px 240px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            Partnership Results
          </h2>
          <div>
            {partnershipResults.map((item, i) => (
              <div key={i} style={{ borderLeft: "3px solid rgba(255,255,255,0.6)", paddingLeft: "24px", marginBottom: "40px" }}>
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
                  {item.bold && <strong style={{ fontWeight: 700 }}>{item.bold}</strong>}
                  {item.rest}
                  {item.boldInline && <strong style={{ fontWeight: 700 }}>{item.boldInline}</strong>}
                  {item.restEnd}
                </p>
              </div>
            ))}
            {stats.map((stat, i) => (
              <div key={i} style={{ borderLeft: "3px solid rgba(255,255,255,0.6)", paddingLeft: "24px", marginBottom: "40px" }}>
                <p style={f({ fontWeight: 700, fontSize: "clamp(28px, 4vw, 42px)", color: "#ffffff", lineHeight: 1.2, marginBottom: "8px" })}>
                  {stat.value}
                </p>
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 })}>
                  {stat.desc}
                </p>
              </div>
            ))}
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
            <div style={{ overflow: "hidden", aspectRatio: "4 / 3" }}>
              <VideoPlaceholder
                thumbnail={"/images/case-studies/green-juju/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg"}
                duration="02:57"
              />
            </div>
            <div style={{ overflow: "hidden", aspectRatio: "4 / 3" }}>
              <VideoPlaceholder
                thumbnail={"/images/case-studies/green-juju/green-juju-ingredientspgtsnd-photography.jpeg"}
                duration="03:29"
              />
            </div>
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
                src={"/images/case-studies/green-juju/kelly-green-juju.webp"}
                alt="Kelley Mirian"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "64px 40px 42px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "24px" })}>
                &ldquo;PGTSND redesigned our website to be far more functional and user-friendly, and the difference has been remarkable. Their thoughtful approach to social media has also elevated how we connect with our audience. Working with their team has been seamless, and the impact on our business is clear—we've grown in ways we couldn't have without them.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Kelley Mirian, Founder at Green Juju
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Ready to show the story behind the work? We're ready to roll.
            </h2>
            <div style={{ marginTop: "10px" }}>
              <CTAButton href="/contact" label="Start a Project" />
            </div>
          </div>
        </section>

        {/* Snack Cutout Full Width */}
        <section style={{ padding: "0" }}>
          <img
            src={"/images/case-studies/green-juju/green-juju-snack-cutout-pgtsnd.png"}
            alt="Green Juju snack"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </section>

        <Footer />
      </div>
    </>
  );
}

function VeggieScrollBar() {
  return (
    <section style={{ padding: "0", position: "relative" }}>
      <div
        style={{
          width: "100%",
          height: "100vh",
          overflowX: "auto",
          overflowY: "hidden",
          background: "#000",
        }}
      >
        <img
          src={"/images/case-studies/green-juju/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg"}
          alt="Green Juju Products"
          style={{
            width: "auto",
            height: "100%",
            display: "block",
          }}
        />
      </div>
      <div style={{ position: "absolute", bottom: "60px", right: "60px" }}>
        <ScrollBadge position="bottom-right" inline />
      </div>
    </section>
  );
}
