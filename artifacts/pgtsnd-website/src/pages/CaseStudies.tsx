import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

const caseStudies = [
  {
    client: "Net Your Problem",
    category: "Brand Film",
    description:
      "A commercial fishing technology startup needed compelling video assets to present at industry conferences and help recruit new partners. We spent time on the water with their team, capturing the real work behind their innovation.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b17487d8-d865-4dac-8457-afe101edc271/catch-close-pgtsnd-bri-dwyer.jpeg",
    quote:
      "The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners.",
    author: "Nicole Baker, Net Your Problem",
  },
  {
    client: "Green Juju",
    category: "Brand Film + Photography",
    description:
      "Green Juju needed a refreshed digital presence to reflect their growth and mission. We developed a full suite of video and photography assets that transformed how they show up online.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/072a41a3-9259-4ffb-a573-6bab24757639/crabs-pelican-pgtsnd-bri-dwyer.jpeg",
    quote:
      "Bri and her team have completely transformed our digital presence, and the difference has been remarkable.",
    author: "Kelly Marian, Green Juju",
  },
  {
    client: "Pacific Coast Fisheries",
    category: "Documentary",
    description:
      "Documenting a season of commercial crabbing required us to be fully embedded with the crew — early mornings, rough seas, and all. The result was an authentic portrait of the industry.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/d00d09c7-98fc-4637-aad9-98173f451b5f/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg",
  },
  {
    client: "Alaska Adventure Bay",
    category: "Aerial + Video",
    description:
      "Sweeping aerials and on-the-ground production combined to tell the full story of one of Alaska's most remote fishing operations.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b7737613-01e6-491f-bb56-a3e38eb70d5f/boats-inlet-pgtsnd-bri-dwyer.jpeg",
  },
];

export default function CaseStudies() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px 32px 100px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(48px, 7vw, 84px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                color: "#ffffff",
                marginBottom: "40px",
              }}
            >
              Real Places.
              <br />
              Real Crews.
              <br />
              Real Results.
            </h1>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.7,
              }}
            >
              Our work takes us into tough conditions and complex industries, where clarity and respect matter most. From the wheelhouse to the studio floor, we show how clients trust us to step in and deliver assets that carry their story forward.
            </p>
          </div>
        </div>

        <ScrollBadge position="bottom-left" />
      </section>

      {/* Case Studies */}
      <section style={{ padding: "0 32px 80px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {caseStudies.map((study, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                padding: "80px 0",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr",
                  gap: "60px",
                  alignItems: "center",
                  direction: i % 2 !== 0 ? "rtl" : "ltr",
                }}
              >
                <div style={{ direction: "ltr" }}>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 600,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "8px",
                    }}
                  >
                    {study.category}
                  </p>
                  <h2
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(28px, 4vw, 48px)",
                      textTransform: "uppercase",
                      letterSpacing: "-0.02em",
                      lineHeight: 0.9,
                      color: "#ffffff",
                      marginBottom: "24px",
                    }}
                  >
                    {study.client}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: "15px",
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.7,
                      maxWidth: "420px",
                      marginBottom: study.quote ? "32px" : "0",
                    }}
                  >
                    {study.description}
                  </p>
                  {study.quote && (
                    <blockquote
                      style={{
                        borderLeft: "3px solid rgba(255,255,255,0.3)",
                        paddingLeft: "20px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 400,
                          fontStyle: "italic",
                          fontSize: "15px",
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.7,
                          marginBottom: "8px",
                        }}
                      >
                        "{study.quote}"
                      </p>
                      <cite
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "rgba(255,255,255,0.5)",
                          fontStyle: "normal",
                        }}
                      >
                        — {study.author}
                      </cite>
                    </blockquote>
                  )}
                </div>
                <div style={{ direction: "ltr", overflow: "hidden", borderRadius: "4px" }}>
                  <img
                    src={study.image}
                    alt={study.client}
                    style={{
                      width: "100%",
                      height: "480px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "1400px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(36px, 6vw, 72px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            color: "#ffffff",
            marginBottom: "32px",
          }}
        >
          Your story is next.
        </h2>
        <CTAButton href="/contact" label="Let's Talk" />
      </section>

      <Footer />
    </div>
  );
}
