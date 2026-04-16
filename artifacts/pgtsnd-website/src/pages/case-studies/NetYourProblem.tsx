import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = ["Video Production", "Photography"];

const heroImage = "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-1.jpeg";

const galleryImages = [
  "/images/case-studies/net-your-problem/net-your-progblem-pgtsnd-photography-2.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-4.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-5.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-6.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-7.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-8.jpeg",
  "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photgraphy-9.jpeg",
  heroImage,
];

const socialLinks = [
  { label: "Visit Instagram", href: "https://www.instagram.com/netyourproblem" },
  { label: "Visit Website", href: "https://www.netyourproblem.com" },
  { label: "Visit YouTube", href: "https://www.youtube.com/@netyourproblem" },
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

export default function NetYourProblem() {
  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "140px 80px 60px", textAlign: "center" }}>
          <h1 style={f({ fontWeight: 900, fontSize: "clamp(36px, 5vw, 64px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
            Net Your Problem X PGTSND
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {services.map((s) => (
              <p key={s} style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>&#183; {s}</p>
            ))}
          </div>
        </section>

        {/* Hero Image with Testimonial Overlay */}
        <section style={{ padding: "0 40px 40px", position: "relative" }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src={heroImage}
              alt="Net Your Problem - Aerial View"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div style={{ position: "absolute", bottom: "40px", left: "60px", maxWidth: "420px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", marginBottom: "-28px", position: "relative", zIndex: 3, border: "3px solid #000" }}>
                <img
                  src={"/images/nicole-baker-pgtsnd.jpg"}
                  alt="Nicole Baker"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ border: "2px solid rgba(255,255,255,0.3)", padding: "44px 28px 28px", background: "rgba(0,0,0,0.85)" }}>
                <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "16px" })}>
                  &ldquo;Bri is the mother in a fishing family. So when we decided to make a film highlighting a friend of ours, their multigenerational fishing family and their decision to recycle nets from their barn, there was no better choice.&rdquo;
                </p>
                <p style={f({ fontWeight: 700, fontSize: "12px", color: "#ffffff" })}>
                  Nicole Baker, Net Your Problem
                </p>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "40px", right: "60px" }}>
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </section>

        {/* Inside Our Partnership + Video 1 */}
        <section style={{ padding: "120px 80px 80px" }}>
          <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "60px" })}>
            Inside Our Partnership
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
            <div>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
                Net Your Problem is tackling one of the fishing industry's biggest challenges: what to do with old nets once their original use life is through. PGTSND brought that mission to life by developing and producing two unique brand films that show the positive impact of net recycling on both communities and the environment.
              </p>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
                We showcased the unique partnership NYP has with coastal communities and the ports they operate in.
              </p>
            </div>
            <VideoPlaceholder
              thumbnail={"/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-8.jpeg"}
              duration="05:04"
            />
          </div>
        </section>

        {/* Video 2 + Text */}
        <section style={{ padding: "0 80px 120px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
            <VideoPlaceholder
              thumbnail={heroImage}
              duration="07:49"
            />
            <div>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "20px" })}>
                In addition, we captured the story of a fishing family on Lopez Island, showing how piles of unused gear, left sitting for decades, can be given a new life through recycling.
              </p>
              <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8 })}>
                Each piece was designed to educate, inspire, and connect, proving that visual storytelling can show how sustainability is not just a practical matter, but deeply human.
              </p>
            </div>
          </div>
        </section>

        {/* Photo Gallery */}
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
                src={"/images/nicole-baker-pgtsnd.jpg"}
                alt="Nicole Baker"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ border: "2px solid rgba(255,255,255,0.3)", padding: "44px 28px 28px" }}>
              <p style={f({ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "16px" })}>
                &ldquo;Bri and her team make the whole process of making a film simple. They come up with interview questions and a shot list, and have let me be as picky as I want during the editing process. The films we've created with her have been remarkably useful for us at conferences and in helping to recruit new partners. We've also taken clips from the long form video to use in social media and they are some of our most successful posts.&rdquo;
              </p>
              <p style={f({ fontWeight: 700, fontSize: "12px", color: "#ffffff" })}>
                Nicole Baker, Net Your Problem
              </p>
            </div>
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 4.5vw, 52px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
              Your work speaks volumes. We're here to make sure it's seen &amp; heard.
            </h2>
            <CTAButton href="/contact" label="Start a Project" />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
