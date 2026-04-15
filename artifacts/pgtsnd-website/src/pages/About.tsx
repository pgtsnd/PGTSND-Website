import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 32px 100px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(60px, 10vw, 120px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.88,
            color: "#ffffff",
          }}
        >
          Resilient roots, steady stories
        </h1>

        <ScrollBadge position="bottom-left" />
      </section>

      {/* Main Content */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "1400px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "start",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.8,
                marginBottom: "28px",
              }}
            >
              PGTSND is built on respect for the people and industries we serve. Our own roots are in tough work, and that resilience keeps us steady no matter the conditions.
            </p>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.8,
                marginBottom: "28px",
              }}
            >
              We're trusted where the stakes are high because we show up prepared, collaborate closely, and capture every story with care. Whether it's on a commercial fishing vessel in Alaskan waters or on a farm in the Pacific Northwest, we bring the same level of commitment to every project.
            </p>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.8,
                marginBottom: "40px",
              }}
            >
              We believe every industry has a story worth telling — and we're here to make sure it's told well.
            </p>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
          <div>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/a4bb4098-6f6b-412f-9f99-da7396dbab92/foggy-fishing-coast-pgtsnd.jpeg"
              alt="A boat on calm water with forested mountains and low-hanging clouds in the background."
              style={{
                width: "100%",
                display: "block",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "1400px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 56px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            color: "#ffffff",
            marginBottom: "60px",
          }}
        >
          What drives us
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "40px",
          }}
        >
          {[
            {
              title: "Respect",
              desc: "We treat every client, every crew, and every location with genuine respect. We earn our place on your team.",
            },
            {
              title: "Resilience",
              desc: "We come from hard work and we're not afraid of it. Rough conditions, early mornings, remote locations — we're built for it.",
            },
            {
              title: "Craft",
              desc: "We care deeply about the quality of what we make. Every frame, every cut, every word is given the attention it deserves.",
            },
          ].map((val) => (
            <div
              key={val.title}
              style={{
                borderTop: "2px solid #ffffff",
                paddingTop: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: "22px",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                  marginBottom: "16px",
                }}
              >
                {val.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.7,
                }}
              >
                {val.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Big Image */}
      <section style={{ padding: "0 32px 80px", maxWidth: "1400px", margin: "0 auto" }}>
        <img
          src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/db4a1401-1cde-44f4-89db-c6db075a8369/2025_PGTSND_PRODUCTIONS-09919.jpg"
          alt="Woman filming a baby goat with a camera on a grassy farm field."
          style={{
            width: "100%",
            height: "60vh",
            objectFit: "cover",
            display: "block",
            borderRadius: "4px",
          }}
        />
      </section>

      <Footer />
    </div>
  );
}
