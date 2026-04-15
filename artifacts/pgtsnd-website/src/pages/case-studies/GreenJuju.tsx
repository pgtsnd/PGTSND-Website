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
  ["Strategy", "Email Marketing"],
  ["Social Media Management", "Graphic Design"],
  ["Social Content Creation", "Photography"],
  ["Website", "Copywriting"],
];

const socialGraphics = [
  `${SQ}/3b0e14e6-2e49-4407-b0af-6602331dd3df/dog-facts-green-juju-pgtsnd-carousel+%281%29.gif`,
  `${SQ}/2c3a7405-2ce9-4fdb-a9ef-4349754fdb4b/seasons-green-juju-pgtsnd-carousel.gif`,
];

const galleryImages = [
  `${SQ}/b4e9b111-3e74-4b5b-83dd-98f1d02798b3/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg`,
  `${SQ}/d9460e68-5cd2-4c0f-94e1-1882061a71e3/green-juju-dog-kitchen-pgtsnd.jpeg`,
  `${SQ}/ef39cdb3-fa41-40b6-b61e-557e31005634/green-juju-ingredientspgtsnd-photography.jpeg`,
  `${SQ}/8ed428da-be7c-4f6d-95f9-b97b8b7a5319/pets-green-juju-pgtsnd-bri-dwyer.jpeg`,
  `${SQ}/55a02970-3204-4c14-8e2d-5edb693fcf5a/green-juju-supplements-close-pgtsnd.jpeg`,
  `${SQ}/757c20ef-3b28-4482-890e-e3e36d5d4ae2/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg`,
  `${SQ}/9d281eb5-fa46-4f12-8304-67eacb64298b/puppies-green-juju-pgtsnd.jpeg`,
  `${SQ}/e2b61cb6-31db-4a52-973a-add624db00c5/green-juju-vitality-blend-pgtsnd.jpeg`,
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

export default function GreenJuju() {
  const [webHovered, setWebHovered] = useState(false);

  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "140px 80px 80px" }}>
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
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "16px", minHeight: "400px" }}>
              <PhoneMockup src={`${SQ}/3b0e14e6-2e49-4407-b0af-6602331dd3df/dog-facts-green-juju-pgtsnd-carousel+%281%29.gif`} style={{ transform: "translateY(-20px)" }} />
              <img
                src={`${SQ}/0cce3b7c-0a1d-4f37-ae43-858324f2c627/dog-with-treats-green-juju-pgtsnd.png`}
                alt="Dog with treats"
                style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-70%)", width: "180px", height: "auto", zIndex: 2 }}
              />
              <PhoneMockup src={`${SQ}/2c3a7405-2ce9-4fdb-a9ef-4349754fdb4b/seasons-green-juju-pgtsnd-carousel.gif`} style={{ transform: "translateY(-40px)" }} />
            </div>
          </div>
        </section>

        {/* Social Media Showcase */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <ScrollBadge position="bottom-left" bottomOffset={-58} />
          <div style={{ background: "rgba(96,120,100,0.4)", borderRadius: "8px", padding: "60px 40px", display: "flex", justifyContent: "center", gap: "24px", alignItems: "center", overflow: "hidden", position: "relative" }}>
            <PhoneMockup src={`${SQ}/757c20ef-3b28-4482-890e-e3e36d5d4ae2/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg`} style={{ width: "220px" }} />
            <PhoneMockup src={`${SQ}/55a02970-3204-4c14-8e2d-5edb693fcf5a/green-juju-supplements-close-pgtsnd.jpeg`} style={{ width: "220px", transform: "translateY(-30px)" }} />
            <PhoneMockup src={`${SQ}/9d281eb5-fa46-4f12-8304-67eacb64298b/puppies-green-juju-pgtsnd.jpeg`} style={{ width: "220px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "40px" }}>
            <img
              src={`${SQ}/5f5f68b2-2bb6-40ab-9dfe-82f7f5757d9d/green-juju-snack-cutout-pgtsnd.png`}
              alt="Green Juju product"
              style={{ width: "140px", height: "auto" }}
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
        <section style={{ padding: "120px 80px", display: "grid", gridTemplateColumns: "2fr 3fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            The Big Picture
          </h2>
          <div>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              PGTSND's partnership with Green Juju is full-spectrum storytelling in action.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              Green Juju came to PGTSND looking for a creative partner who could match their ambition and amplify their reach. Since 2024, we've become a full-spectrum extension of their team, trusted to creatively shape everything from daily social content to long-term brand strategy.
            </p>
          </div>
        </section>

        {/* Product Tubs + Testimonial */}
        <section style={{ padding: "0 80px 0", position: "relative" }}>
          <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
            <img
              src={`${SQ}/b4e9b111-3e74-4b5b-83dd-98f1d02798b3/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg`}
              alt="Green Juju Products"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div style={{ position: "absolute", bottom: "20px", right: "20px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
          <div style={{ maxWidth: "400px", position: "relative", marginTop: "-60px", marginLeft: "60px", zIndex: 2 }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", position: "relative", zIndex: 3, border: "3px solid #000" }}>
              <img
                src={`${SQ}/7bc26c26-455f-40a9-a671-e74403d35309/kelly-green-juju.webp`}
                alt="Kelley Mirian"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid rgba(255,255,255,0.5)", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
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
        <section style={{ padding: "120px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          <div>
            <div
              style={{ position: "relative", cursor: "pointer", marginBottom: "24px" }}
              onMouseEnter={() => setWebHovered(true)}
              onMouseLeave={() => setWebHovered(false)}
            >
              <img
                src={`${SQ}/2f6d54e5-6b48-405f-8654-7fc599917526/green-juju-web-design-pgtsnd-screen-capture.jpeg`}
                alt="Green Juju Website"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "4px" }}
              />
              <img
                src={`${SQ}/1fbedf6e-bf89-4125-85a8-042b311f7004/juju-cursor-case-study.png`}
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
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              We reimagined their website to become the homebase hub that sets the example and built out email marketing campaigns to nurture loyal customers.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              Each piece we create ties back to a core narrative: Green Juju is about real food, real results, and healthier, happier pets.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              In strategy and execution, we work as an extension of Green Juju's team, demonstrating how integrated storytelling can transform a brand, and how our approach strengthens business impact.
            </p>
          </div>
        </section>

        {/* Full Production Suite + */}
        <section style={{ padding: "0 80px 120px", display: "grid", gridTemplateColumns: "2fr 3fr", gap: "80px", alignItems: "start" }}>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(24px, 3vw, 36px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1, color: "#ffffff", marginBottom: "32px" })}>
              Full Production Suite +
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
              We began with photo and video production, building a library of lifestyle and product visuals that showcased Green Juju's unique place in the pet food market.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
              Our role expanded to copywriting, blogs, website content, and product descriptions, delivered in a consistent voice that balances education, trust, and warmth.
            </p>
          </div>
          <div>
            <div style={{ borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
              <img
                src={`${SQ}/31cc33f0-3355-4f8b-a80a-d9c71b4abf94/green-juju-blog-post-pgtsnd-productions.jpg`}
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

        {/* Vitality Blend Flat Lay */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <div style={{ width: "100%", overflow: "hidden" }}>
            <img
              src={`${SQ}/e2b61cb6-31db-4a52-973a-add624db00c5/green-juju-vitality-blend-pgtsnd.jpeg`}
              alt="Green Juju Vitality Blend"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
          <div style={{ position: "absolute", bottom: "60px", right: "60px" }}>
            <ScrollBadge position="bottom-right" inline />
          </div>
        </section>

        {/* Partnership Results */}
        <section style={{ padding: "100px 80px", display: "grid", gridTemplateColumns: "2fr 3fr", gap: "80px", alignItems: "start" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff" })}>
            Partnership Results
          </h2>
          <div>
            {partnershipResults.map((item, i) => (
              <div key={i} style={{ borderLeft: "3px solid rgba(255,255,255,0.6)", paddingLeft: "24px", marginBottom: "40px" }}>
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
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
          </div>
        </section>

        {/* Videos */}
        <section style={{ padding: "40px 80px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <VideoPlaceholder
              thumbnail={`${SQ}/757c20ef-3b28-4482-890e-e3e36d5d4ae2/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg`}
              duration="02:57"
            />
            <VideoPlaceholder
              thumbnail={`${SQ}/ef39cdb3-fa41-40b6-b61e-557e31005634/green-juju-ingredientspgtsnd-photography.jpeg`}
              duration="03:29"
            />
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
        <section style={{ padding: "80px 80px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "440px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", position: "relative", zIndex: 3, border: "3px solid #000" }}>
              <img
                src={`${SQ}/7bc26c26-455f-40a9-a671-e74403d35309/kelly-green-juju.webp`}
                alt="Kelley Mirian"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid rgba(255,255,255,0.3)", padding: "44px 28px 28px" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "16px" })}>
                &ldquo;PGTSND redesigned our website to be far more functional and user-friendly, and the difference has been remarkable. Their thoughtful approach to social media has also elevated how we connect with our audience. Working with their team has been seamless, and the impact on our business is clear—we've grown in ways we couldn't have without them.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "12px", color: "#ffffff" })}>
                Kelley Mirian, Founder at Green Juju
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Ready to show the story behind the work? We're ready to roll.
            </h2>
            <CTAButton href="/contact" label="Start a Project" />
          </div>
        </section>

        {/* Product Lineup Full Width */}
        <section style={{ padding: "0 40px 0" }}>
          <img
            src={`${SQ}/ef39cdb3-fa41-40b6-b61e-557e31005634/green-juju-ingredientspgtsnd-photography.jpeg`}
            alt="Green Juju Product Lineup"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </section>

        <Footer />
      </div>
    </>
  );
}
