import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = ["Photography"];

const heroImage = "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-19.jpeg";

const galleryImages = [
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-18.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-3.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-12.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-4.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-6.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-7.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-9.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-10.jpeg",
  "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-2.jpeg",
];

const socialLinks = [
  { label: "Visit Instagram", href: "https://www.instagram.com/vallationouterwear" },
  { label: "Visit Website", href: "https://www.vallationouterwear.com" },
];

export default function VallationOuterwear() {
  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        <section style={{ padding: "160px 80px 180px", textAlign: "center" }}>
          <h1 style={f({ fontWeight: 900, fontSize: "clamp(36px, 5vw, 64px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
            Vallation Outerwear X PGTSND
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {services.map((s) => (
              <p key={s} style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>&#183; {s}</p>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <div style={{ position: "relative", overflow: "visible" }}>
            <div style={{ width: "100%", height: "clamp(340px, 40vw, 520px)", overflow: "hidden" }}>
              <img
                src={heroImage}
                alt="Vallation Outerwear - On the Water"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }}
              />
            </div>
            <div style={{ position: "absolute", bottom: "-60px", left: "60px", maxWidth: "420px", zIndex: 2 }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
                <img
                  src="/images/case-studies/vallation-outerwear/vallation-outerwear-logo.png"
                  alt="Vallation Outerwear"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ border: "2px solid #ffffff", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: "16px" })}>
                  &ldquo;When we decided we needed more photos of our gear in its element in commercial fishing we reached out to Bri at PGTSND Productions. Their prior work and experience within commercial fishing made our choice easy.&rdquo;
                </p>
                <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                  Cory Jackson, Vallation Outerwear
                </p>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "40px", right: "60px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </section>

        <section style={{ padding: "220px 80px 240px" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "60px" })}>
            Inside Our Partnership
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
            <div>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
                Capturing the brand at work in its natural element was the goal. By taking to the open water for a lifestyle-focused photoshoot, we showcased their gear in the conditions it was built for.
              </p>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
                The resulting gallery gave Vallation a versatile library of professional images, ready to be used across their website, print materials, point-of-sale displays, and social media content.
              </p>
            </div>
            <div>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
                The strength of these visuals creates consistency, elevates brand presence, and extends the life of every marketing effort. With this shoot, Vallation gained photography that works as hard as their outerwear does.
              </p>
            </div>
          </div>
        </section>

        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <ScrollBadge position="bottom-left" bottomOffset={-58} />
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

        <section style={{ padding: "40px 80px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${socialLinks.length}, 1fr)`, gap: "16px" }}>
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

        <section style={{ padding: "200px 80px 200px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div style={{ maxWidth: "480px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", marginLeft: "24px", position: "relative", zIndex: 3 }}>
              <img
                src="/images/case-studies/vallation-outerwear/vallation-outerwear-logo.png"
                alt="Vallation Outerwear"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid #ffffff", padding: "64px 40px 42px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={f({ fontWeight: 400, fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "24px" })}>
                &ldquo;When we decided we needed more photos of our gear in its element in commercial fishing we reached out to Bri at PGTSND Productions. Their prior work and experience within commercial fishing made our choice easy. Bri and her team's photos for us not only captured what we needed as a company, but went above and beyond to find photos that we as a brand could utilize for many years to come.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "13px", color: "#ffffff" })}>
                Cory Jackson, Vallation Outerwear
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 4.5vw, 52px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Your work speaks volumes. We're here to make sure it's seen &amp; heard.
            </h2>
            <div style={{ marginTop: "10px" }}>
              <CTAButton href="/contact" label="Start a Project" />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
