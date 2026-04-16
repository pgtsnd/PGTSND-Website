import { useState } from "react";
import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import TestimonialCard from "../components/TestimonialCard";
import VideoPlaceholder from "../components/VideoPlaceholder";
import Footer from "../components/Footer";

function HoverFlipImage({ src, hoverSrc, alt, style, children }: { src: string; hoverSrc: string; alt: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", cursor: "pointer", ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: hovered ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />
      <img
        src={hoverSrc}
        alt={alt}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* ===== HERO SECTION ===== */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "160px 80px 100px",
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
      <section style={{ paddingTop: "100px", padding: "100px 80px 0", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ position: "relative" }}>
          <VideoPlaceholder
            imageSrc={`${import.meta.env.BASE_URL}images/nicole-baker-pgtsnd.jpg`}
            imageAlt="PGTSND video production reel"
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              right: "40px",
              maxWidth: "400px",
              width: "45%",
              minWidth: "320px",
              zIndex: 10,
            }}
          >
            <TestimonialCard
              quote={"The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners."}
              author="Nicole Baker, Net Your Problem"
              avatarSrc={`${import.meta.env.BASE_URL}images/nicole-baker-pgtsnd.jpg`}
              avatarAlt="Nicole Baker"
            />
          </div>
        </div>
        <div style={{ height: "100px" }} />
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section style={{ padding: "180px 80px 260px", maxWidth: "1400px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "28px",
          }}
        >
          services
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
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
                fontSize: "19px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.7,
                paddingTop: "8px",
                marginBottom: "48px",
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
          padding: "60px 80px 0",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "6px",
          }}
        >
          <div style={{ aspectRatio: "4/3" }}>
            <HoverFlipImage
              src={`${import.meta.env.BASE_URL}images/2025_PGTSND_PRODUCTIONS-09919.jpg`}
              hoverSrc={`${import.meta.env.BASE_URL}images/catch-close-pgtsnd-bri-dwyer.jpeg`}
              alt="Woman filming a baby goat with a camera on a grassy farm field."
            />
          </div>
          <div style={{ aspectRatio: "4/3" }}>
            <HoverFlipImage
              src={`${import.meta.env.BASE_URL}images/bri-and-team-at-camera-pgtsnd-productions.jpeg`}
              hoverSrc={`${import.meta.env.BASE_URL}images/crabs-pelican-pgtsnd-bri-dwyer.jpeg`}
              alt="Two people looking at a camera in a video production environment."
            />
          </div>
          <div style={{ aspectRatio: "4/3", position: "relative" }}>
            <HoverFlipImage
              src={`${import.meta.env.BASE_URL}images/2024_BRI_DWYER-02064.jpg`}
              hoverSrc={`${import.meta.env.BASE_URL}images/net-hands-close-pgtsnd-bri-dwyer.jpeg`}
              alt="PGTSND Productions videographer filming on a commercial fishing vessel."
            />
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 99,
              }}
            >
              <ScrollBadge position="bottom-right" inline />
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section style={{ padding: "230px 80px 260px", maxWidth: "1400px", margin: "0 auto" }}>
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
                marginBottom: "28px",
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
                fontSize: "18px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
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
            gridTemplateRows: "auto auto",
            gap: "6px",
          }}
        >
          <div style={{ overflow: "hidden", aspectRatio: "4 / 3" }}>
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

          <div style={{ overflow: "hidden", aspectRatio: "4 / 3" }}>
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
          </div>

          <div style={{ position: "relative", overflow: "visible" }}>
            <div style={{ aspectRatio: "4 / 3", overflow: "hidden" }}>
              <img
                src={`${import.meta.env.BASE_URL}images/boats-inlet-pgtsnd-bri-dwyer.jpeg`}
                alt="An aerial view of a river winding through a dense forest with trees on both sides, and two boats traveling downstream."
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "-80px",
                right: "25px",
                left: "30%",
                zIndex: 10,
              }}
            >
              <TestimonialCard
                quote={"Bri and her team have completely transformed our digital presence, and the difference has been remarkable."}
                author="Kelly Marian, Green Juju"
                avatarSrc={`${import.meta.env.BASE_URL}images/kelly-green-juju.jpeg`}
                avatarAlt="Kelly Marian"
              />
            </div>

            <div style={{ position: "absolute", bottom: "50px", left: "9px", zIndex: 11 }}>
              <ScrollBadge position="bottom-left" inline />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "60px 48px",
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
                marginBottom: "24px",
              }}
            >
              Case Studies
            </p>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 4.5vw, 48px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                marginBottom: "32px",
              }}
            >
              Trusted in tough places
            </h2>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.75,
                marginBottom: "48px",
                maxWidth: "440px",
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
      <section style={{ padding: "360px 80px 180px", maxWidth: "1400px", margin: "0 auto" }}>
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
                marginBottom: "28px",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000000",
            zIndex: 0,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/boats-aerial-drone-pgtsnd.png`}
            alt="Aerial view of docked boats"
            style={{
              width: "100%",
              height: "calc(100% + 150px)",
              objectFit: "cover",
              objectPosition: "center center",
              marginTop: "-75px",
              opacity: 0.2,
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ marginBottom: "40px" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/pgtsnd-drone.png`}
              alt="Drone illustration"
              style={{
                width: "480px",
                height: "auto",
                margin: "0 auto",
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
