import CTAButton from "../../components/CTAButton";
import ScrollBadge from "../../components/ScrollBadge";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const f = (s: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Montserrat', sans-serif",
  ...s,
});

const services = ["Web Design", "Logo Redesign"];

export default function AlaskaWhitefishTrawlers() {
  return (
    <>
      <Header />
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        {/* Hero */}
        <section style={{ padding: "160px 40px 180px", textAlign: "center" }}>
          <h1 style={f({ fontWeight: 900, fontSize: "clamp(36px, 5.5vw, 72px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, color: "#ffffff", marginBottom: "32px" })}>
            Alaska Whitefish Trawlers Association X PGTSND
          </h1>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {services.map((s) => (
              <p key={s} style={f({ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>&#183; {s}</p>
            ))}
          </div>
        </section>

        {/* Website Screenshot - Wide Scrollable + Laptop Overlay */}
        <section style={{ padding: "0 40px 0", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              overflow: "hidden",
              overflowY: "auto",
              paddingBottom: "70px",
              borderRadius: "4px",
              border: "2px solid rgba(255,255,255,0.15)",
              aspectRatio: "21 / 9",
              background: "#ffffff",
            }}>
              <img
                src={"/images/case-studies/awt/alaska-white-fish-web-design-sample-pgtsnd.webp"}
                alt="Alaska Whitefish Trawlers Website Design"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <div style={{ position: "absolute", bottom: "-60px", right: "60px", width: "280px", zIndex: 2 }}>
              <div style={{ position: "relative" }}>
                <div style={{ overflow: "hidden", borderRadius: "0 0 3px 3px" }}>
                  <img
                    src={"/images/case-studies/awt/alaska-whitefish-web-design-sample-2.png"}
                    alt="Alaska Whitefish Trawlers Website on Laptop"
                    style={{ width: "100%", display: "block", transform: "translateY(-12px)" }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", left: "15px", bottom: "-130px" }}>
            <ScrollBadge position="bottom-right" inline />
          </div>
        </section>

        {/* Wild Sustainable & Affordable */}
        <section style={{ padding: "200px 40px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
            <div style={{ background: "#f0ede8", padding: "60px 40px", borderRadius: "4px" }}>
              <div style={{ borderTop: "3px solid #1a2e5a", paddingTop: "40px", textAlign: "center" }}>
                <h2 style={f({ fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 42px)", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1, color: "#1a2e5a", marginBottom: "32px" })}>
                  Wild, Sustainable &amp; Affordable
                </h2>
                <img
                  src={"/images/site/screen-shot-2021-08-02.png"}
                  alt="Pollock Fish"
                  style={{ width: "280px", height: "auto", margin: "0 auto 32px", display: "block" }}
                />
                <p style={f({ fontWeight: 400, fontSize: "15px", color: "#1a2e5a", lineHeight: 1.7, marginBottom: "16px", textAlign: "left" })}>
                  77% of what we catch in the Gulf of Alaska is pollock caught with a midwater trawl.
                </p>
                <p style={f({ fontWeight: 400, fontSize: "13px", color: "rgba(26,46,90,0.8)", lineHeight: 1.7, textAlign: "left" })}>
                  Most people are familiar with Alaska pollock – it's what's in fish sticks, fish fillet sandwiches, and imitation crab meat! Other fish we catch include Pacific cod.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Inside Our Partnership */}
        <section style={{ padding: "200px 80px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>
          <div style={{ background: "#ffffff", borderRadius: "4px", padding: "60px 40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={"/images/case-studies/awt/aktrawlers-FINAL.png"}
              alt="Alaska Whitefish Trawlers Logo - Original"
              style={{ width: "260px", height: "auto" }}
            />
          </div>
          <div>
            <h2 style={f({ fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, color: "#ffffff", marginBottom: "32px" })}>
              Inside Our Partnership
            </h2>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              Trade associations often carry the weight of history, which makes it all the more meaningful when their identity evolves for the next generation.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2 })}>
              For the Alaska Whitefish Trawlers Association, PGTSND delivered a fresh, functional platform that kept education at the forefront, while bringing the brand into a new era.
            </p>
          </div>
        </section>

        {/* Bottom Text + New Logo */}
        <section style={{ padding: "80px 80px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>
          <div>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "28px" })}>
              From there, we captured fresh supporting photography, and fully designed and launched a clean, user-friendly website making it simple for members and the public to find the information they need.
            </p>
            <p style={f({ fontWeight: 400, fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 2, marginBottom: "40px" })}>
              The result is a digital presence that reflects the association's professionalism and provides a lasting foundation for communication.
            </p>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
          <div style={{ background: "#ffffff", borderRadius: "4px", padding: "60px 40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={"/images/case-studies/awt/aktrawlers-FINAL.png"}
              alt="Alaska Whitefish Trawlers Logo - New"
              style={{ width: "260px", height: "auto" }}
            />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
