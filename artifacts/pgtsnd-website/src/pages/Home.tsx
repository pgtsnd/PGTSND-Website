import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* ===== HERO SECTION ===== */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "160px 80px 80px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "40px",
          }}
        >
          <div style={{ maxWidth: "700px" }}>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(48px, 7vw, 80px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.92,
                color: "#ffffff",
                marginBottom: "32px",
              }}
            >
              We get dirty with you.
            </h1>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                color: "#ffffff",
                lineHeight: 1.7,
                maxWidth: "480px",
              }}
            >
              On deck, in the mud, sliding through snow, or riding the swells. We go where your work happens and capture your story with clarity and conviction.
            </p>
          </div>
          <CTAButton href="/contact" label="Let's Get To Work" />
        </div>
      </section>

      {/* ===== VIDEO / IMAGE SECTION WITH OVERLAPPING TESTIMONIAL ===== */}
      <section
        style={{
          padding: "0 80px 0",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/3ac5c6c9-cb24-463f-b0e5-f7e38da1179b/nicole-baker-pgtsnd.jpg"
            alt="Boat on the water - PGTSND video production"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "cover",
              minHeight: "400px",
              maxHeight: "600px",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "40px",
              transform: "translateY(50%)",
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "32px",
              maxWidth: "400px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-28px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <img
                src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/3ac5c6c9-cb24-463f-b0e5-f7e38da1179b/nicole-baker-pgtsnd.jpg"
                alt="Nicole Baker"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              />
            </div>
            <blockquote
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >
              "The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners."
            </blockquote>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                color: "#ffffff",
              }}
            >
              Nicole Baker, Net Your Problem
            </p>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section style={{ padding: "160px 80px 100px", maxWidth: "1400px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "24px",
          }}
        >
          services
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
          }}
        >
          <h2
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(36px, 4vw, 50px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              color: "#ffffff",
            }}
          >
            Production built for working industries
          </h2>
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "17px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.7,
                paddingTop: "8px",
                marginBottom: "40px",
              }}
            >
              We handle the logistics, the craft, and the storytelling from planning through post, so your message lands strong and is ready to use.
            </p>
            <CTAButton href="/services" label="What We Do" />
          </div>
        </div>
      </section>

      {/* ===== THREE PHOTOS STRIP ===== */}
      <section
        style={{
          padding: "0 80px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
          }}
        >
          <div style={{ overflow: "hidden", aspectRatio: "4/3" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/db4a1401-1cde-44f4-89db-c6db075a8369/2025_PGTSND_PRODUCTIONS-09919.jpg"
              alt="Woman filming a baby goat with a camera on a grassy farm field."
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div style={{ overflow: "hidden", aspectRatio: "4/3" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/bri-and-team-at-camera-pgtsnd-productions.jpeg`}
              alt="Two people looking at a camera in a video production environment."
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div style={{ overflow: "hidden", aspectRatio: "4/3", position: "relative" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/e243522b-de50-4eb9-ae36-3c618ea6ae5d/2024_BRI_DWYER-02064.jpg"
              alt="PGTSND Productions videographer filming on a commercial fishing vessel."
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
              }}
            >
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section style={{ padding: "160px 80px 120px", maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "end",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              About Us
            </p>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(36px, 4.5vw, 52px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                marginBottom: "40px",
              }}
            >
              Resilient roots, steady stories
            </h2>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.8,
                marginBottom: "48px",
                maxWidth: "440px",
              }}
            >
              PGTSND is built on respect for the people and industries we serve. Our own roots are in tough work, and that resilience keeps us steady no matter the conditions. We're trusted where the stakes are high because we show up prepared, collaborate closely, and capture every story with care.
            </p>
            <CTAButton href="/about" label="Get To Know Us" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/pgt-snd-tripod-horizontal.png`}
              alt="Outline drawing of film and video production equipment."
              style={{
                maxWidth: "380px",
                width: "100%",
                opacity: 0.9,
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== CASE STUDIES 2x2 GRID ===== */}
      <section style={{ padding: "0 80px 0", maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg`}
              alt="A person tying their boots on a metal diamond-plated floor with Adventure Bay Fish Co. crate."
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "grayscale(100%)",
              }}
            />
          </div>

          <div style={{ overflow: "hidden" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b7737613-01e6-491f-bb56-a3e38eb70d5f/boats-inlet-pgtsnd-bri-dwyer.jpeg"
              alt="A boat on misty water surrounded by forested mountains."
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div style={{ overflow: "hidden", position: "relative" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/foggy-fishing-coast-pgtsnd.jpeg`}
              alt="A boat on calm water with forested mountains and low-hanging clouds in the background."
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: "24px",
                left: "24px",
                right: "24px",
                background: "rgba(0,0,0,0.85)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "32px",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-28px",
                  left: "32px",
                }}
              >
                <img
                  src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/7bc26c26-455f-40a9-a671-e74403d35309/kelly-green-juju.webp"
                  alt="Kelly Marian"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                />
              </div>
              <blockquote
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.85)",
                  marginTop: "8px",
                  marginBottom: "16px",
                }}
              >
                "Bri and her team have completely transformed our digital presence, and the difference has been remarkable."
              </blockquote>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#ffffff",
                }}
              >
                Kelly Marian, Green Juju
              </p>
            </div>

            <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
              <ScrollBadge position="bottom-left" inline />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "48px",
            }}
          >
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "16px",
              }}
            >
              Case Studies
            </p>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px, 4vw, 44px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                marginBottom: "24px",
              }}
            >
              Trusted in tough places
            </h2>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
                marginBottom: "32px",
              }}
            >
              When the work is wild and the conditions are demanding, clients put their confidence in us to capture it right. See how that trust shows up in action.
            </p>
            <div>
              <CTAButton href="/case-studies" label="See Our Work" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL / INSTAGRAM SECTION ===== */}
      <section style={{ padding: "160px 80px 100px", maxWidth: "1400px", margin: "0 auto" }}>
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
                fontWeight: 700,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "24px",
              }}
            >
              Catch Us On Social
            </p>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 56px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                color: "#ffffff",
                marginBottom: "40px",
              }}
            >
              On deck with PGTSND Productions
            </h2>
            <CTAButton
              href="https://www.instagram.com/pgtsndproductions/"
              label="Follow PGTSND"
              external
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  background: "#1a1a1a",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `hsl(${i * 30}, 15%, 25%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity={0.8}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== READY TO ROLL CTA ===== */}
      <section
        style={{
          position: "relative",
          padding: "120px 80px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0a0a0a",
            zIndex: 0,
          }}
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/072a41a3-9259-4ffb-a573-6bab24757639/crabs-pelican-pgtsnd-bri-dwyer.jpeg"
            alt="Aerial view of docked boats"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/ca4eed01-9d7f-45f5-9e2f-e8a659284610/pgtsnd-drone.webp"
              alt="Drone illustration"
              style={{
                width: "160px",
                height: "auto",
                margin: "0 auto",
                filter: "invert(1)",
              }}
            />
          </div>
          <h2
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(36px, 6vw, 64px)",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              color: "#ffffff",
              marginBottom: "20px",
            }}
          >
            Ready to roll?
          </h2>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              marginBottom: "40px",
              maxWidth: "500px",
              margin: "0 auto 40px",
            }}
          >
            Tell us what success looks like to you. We'll build the assets to get you there.
          </p>
          <CTAButton href="/contact" label="Let's Talk" variant="light" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
