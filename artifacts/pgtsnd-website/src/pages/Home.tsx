import CTAButton from "../components/CTAButton";
import Footer from "../components/Footer";

const serviceImages = [
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b17487d8-d865-4dac-8457-afe101edc271/catch-close-pgtsnd-bri-dwyer.jpeg",
    alt: "Person in orange waterproof pants and brown boots on a boat floor, holding a fish with a net beside others on the floor, with multiple fish scattered around.",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/db4a1401-1cde-44f4-89db-c6db075a8369/2025_PGTSND_PRODUCTIONS-09919.jpg",
    alt: "Woman filming a baby goat with a camera on a grassy farm field.",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/797a5279-175e-486a-9cce-3a78bfa11c6e/bri-and-team-at-camera-pgtsnd-productions.jpeg",
    alt: "Two people, a man and a woman, are looking at a camera in a video production environment, with a wooden interior background.",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/ef5a6e91-5e5f-4a5f-80da-b09b16076688/net-hands-close-pgtsnd-bri-dwyer.jpeg",
    alt: "A person wearing an orange raincoat and gloves repairing a blue fishing net outdoors.",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/e243522b-de50-4eb9-ae36-3c618ea6ae5d/2024_BRI_DWYER-02064.jpg",
    alt: "PGTSND Productions videographer filming on a commercial fishing vessel.",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/072a41a3-9259-4ffb-a573-6bab24757639/crabs-pelican-pgtsnd-bri-dwyer.jpeg",
    alt: "Open cooler box filled with freshly caught crabs, placed outdoors near water, with a background of ocean and sky.",
  },
];

export default function Home() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 32px 60px",
          maxWidth: "1400px",
          margin: "0 auto",
          position: "relative",
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
          <div style={{ maxWidth: "600px" }}>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(56px, 8vw, 84px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
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
                fontSize: "16px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.7,
                maxWidth: "400px",
              }}
            >
              On deck, in the mud, sliding through snow, or riding the swells. We go where your work happens and capture your story with clarity and conviction.
            </p>
          </div>
          <CTAButton href="/contact" label="Let's Get To Work" />
        </div>
      </section>

      {/* Video Section */}
      <section style={{ padding: "0 32px 80px", maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            width: "100%",
            background: "#111111",
            borderRadius: "4px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/3ac5c6c9-cb24-463f-b0e5-f7e38da1179b/nicole-baker-pgtsnd.jpg"
            alt="PGTSND video production"
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
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <a
              href="https://www.pgtsndproductions.com/#"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(128,128,128,0.9)",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Play
          </div>
        </div>
      </section>

      {/* Testimonial - Nicole Baker */}
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
            display: "flex",
            alignItems: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/3ac5c6c9-cb24-463f-b0e5-f7e38da1179b/nicole-baker-pgtsnd.jpg"
            alt="A young woman smiling outdoors with a green hilly landscape behind her, sitting on a rope platform."
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <div>
            <blockquote
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.6,
                color: "#ffffff",
                maxWidth: "700px",
                marginBottom: "16px",
              }}
            >
              "The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners."
            </blockquote>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Nicole Baker, Net Your Problem
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={{ padding: "80px 32px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "16px",
            }}
          >
            services
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 56px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                maxWidth: "600px",
              }}
            >
              Production built for working industries
            </h2>
            <CTAButton href="/services" label="What We Do" />
          </div>
          <p
            style={{
              marginTop: "24px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              maxWidth: "480px",
            }}
          >
            We handle the logistics, the craft, and the storytelling from planning through post, so your message lands strong and is ready to use.
          </p>
        </div>

        {/* Image Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {serviceImages.map((img, i) => (
            <div
              key={i}
              style={{
                overflow: "hidden",
                aspectRatio: "4/3",
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 0.4s ease",
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
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
            gap: "60px",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "16px",
              }}
            >
              About Us
            </p>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 4vw, 48px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                marginBottom: "28px",
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
                lineHeight: 1.7,
                marginBottom: "32px",
              }}
            >
              PGTSND is built on respect for the people and industries we serve. Our own roots are in tough work, and that resilience keeps us steady no matter the conditions. We're trusted where the stakes are high because we show up prepared, collaborate closely, and capture every story with care.
            </p>
            <CTAButton href="/about" label="Get To Know Us" />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/da2bf98c-a194-492e-b033-0bd7a8f3010a/pgt-snd-tripod-horizontal.webp"
              alt="Outline drawing of film and video production equipment."
              style={{
                maxWidth: "100%",
                filter: "invert(1)",
                opacity: 0.85,
              }}
            />
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "16px",
            }}
          >
            Case Studies
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(32px, 5vw, 56px)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                color: "#ffffff",
                maxWidth: "500px",
              }}
            >
              Trusted in tough places
            </h2>
            <CTAButton href="/case-studies" label="See Our Work" />
          </div>
          <p
            style={{
              marginTop: "24px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              maxWidth: "480px",
            }}
          >
            When the work is wild and the conditions are demanding, clients put their confidence in us to capture it right. See how that trust shows up in action.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div style={{ overflow: "hidden", aspectRatio: "4/3" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/b7737613-01e6-491f-bb56-a3e38eb70d5f/boats-inlet-pgtsnd-bri-dwyer.jpeg"
              alt="An aerial view of a river winding through a dense forest with trees on both sides, and two boats traveling downstream."
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ overflow: "hidden", aspectRatio: "4/3" }}>
            <img
              src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/d00d09c7-98fc-4637-aad9-98173f451b5f/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg"
              alt="A person is tying their shoelaces while sitting on a floor with metal diamond plating."
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* Testimonial - Kelly Marian */}
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
            display: "flex",
            alignItems: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/7bc26c26-455f-40a9-a671-e74403d35309/kelly-green-juju.webp"
            alt="A woman with long blonde hair smiling and laughing, wearing a light blue shirt"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <div>
            <blockquote
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.6,
                color: "#ffffff",
                maxWidth: "700px",
                marginBottom: "16px",
              }}
            >
              "Bri and her team have completely transformed our digital presence, and the difference has been remarkable."
            </blockquote>
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Kelly Marian, Green Juju
            </p>
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section
        style={{
          padding: "80px 32px",
          maxWidth: "1400px",
          margin: "0 auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "16px",
          }}
        >
          catch us on social
        </p>
        <h2
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(36px, 6vw, 72px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 0.9,
            color: "#ffffff",
            marginBottom: "40px",
          }}
        >
          On deck with PGTSND Productions
        </h2>
        <a
          href="https://www.instagram.com/pgtsndproductions/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            background: "#000000",
            border: "2px solid #ffffff",
            borderRadius: "999px",
            padding: "12px 28px 12px 14px",
            color: "#ffffff",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ffffff",
              color: "#000000",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </span>
          Follow PGTSND
        </a>

        <div style={{ marginTop: "48px" }}>
          <img
            src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/ca4eed01-9d7f-45f5-9e2f-e8a659284610/pgtsnd-drone.webp"
            alt="Line drawing of a drone with four propellers facing downward."
            style={{
              maxWidth: "200px",
              margin: "0 auto",
              filter: "invert(1)",
              opacity: 0.6,
            }}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
