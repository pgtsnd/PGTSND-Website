import { useState } from "react";
import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

const caseStudies = [
  {
    client: "Alaska Bering Sea Crabbers",
    category: "Documentary + Photography",
    description:
      "Documenting a season of commercial crabbing required us to be fully embedded with the crew — early mornings, rough seas, and all. The result was an authentic portrait of the industry.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/e8f0c233-3e66-4424-af76-721f2754573d/gloves-close-bri-dwyer-pgtsnd-alaska-berring.jpeg",
  },
  {
    client: "Net Your Problem",
    category: "Brand Film",
    description:
      "A commercial fishing technology startup needed compelling video assets to present at industry conferences and help recruit new partners.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/3d1c1f4e-8f0a-4e37-b7e0-2a10b38f5d7a/fisherman-net-pgtsnd-bri-dwyer.jpeg",
  },
  {
    client: "Green Juju",
    category: "Brand Film + Photography",
    description:
      "Green Juju needed a refreshed digital presence to reflect their growth and mission. We developed a full suite of video and photography assets.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/d9460e68-5cd2-4c0f-94e1-1882061a71e3/green-juju-dog-kitchen-pgtsnd.jpeg",
  },
  {
    client: "Pacific Coast Fisheries",
    category: "On-Location Photography",
    description:
      "Sweeping on-location production combined to tell the full story of the hard-working crews behind Pacific Coast's commercial fishing operations.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/1b8f7e3a-4d2c-4a9e-b6f3-8c5e2d1a7b4f/fisherman-yellow-jacket-pgtsnd.jpeg",
  },
  {
    client: "Vallation Outerwear",
    category: "Brand Campaign",
    description:
      "From the start, PGTSND worked with Vallation on their goals for what they wanted to accomplish, and within the parameters they set.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/7a3b2c1d-5e4f-4a8b-9c6d-3f2e1a0b9c8d/boat-spray-pgtsnd.jpeg",
  },
  {
    client: "NW Sablefish",
    category: "Full Production Suite",
    description:
      "A complete visual overhaul for NW Sablefish — from on-the-water photography to plated culinary shots that showcase the product at every stage.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/93006ba2-8cb2-4602-994e-d06460bddefb/nw-sablefish-pgtsnd-photography-7.jpeg",
  },
  {
    client: "Puget Sound Fisheries",
    category: "Documentary Photography",
    description:
      "An incredible collection of images from the Puget Sound commercial Dungeness fishery, capturing the gear, grit, and community behind the catch.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/4c5d6e7f-8a9b-4c1d-2e3f-5a6b7c8d9e0f/fishing-nets-colorful-pgtsnd.jpeg",
  },
];

function GalleryCard({ study }: { study: typeof caseStudies[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={study.image}
        alt={study.client}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.5s ease",
          transform: hovered ? "scale(1.04)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "40px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        <p style={f({
          fontWeight: 600,
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.6)",
          marginBottom: "8px",
        })}>
          {study.category}
        </p>
        <h3 style={f({
          fontWeight: 900,
          fontSize: "clamp(24px, 3vw, 36px)",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "#ffffff",
          marginBottom: "12px",
        })}>
          {study.client}
        </h3>
        <p style={f({
          fontWeight: 400,
          fontSize: "14px",
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.7,
          maxWidth: "400px",
        })}>
          {study.description}
        </p>
      </div>
    </div>
  );
}

export default function CaseStudies() {
  return (
    <div style={{ background: "#000000", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 80px 100px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "end",
          }}
        >
          <div>
            <h1
              style={f({
                fontWeight: 900,
                fontSize: "clamp(56px, 8vw, 100px)",
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
                color: "#ffffff",
              })}
            >
              Real Places.
              <br />
              Real Crews.
              <br />
              Real Results.
            </h1>
          </div>
          <div>
            <p
              style={f({
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.8,
                maxWidth: "500px",
                marginBottom: "40px",
              })}
            >
              Our work takes us into tough conditions and complex industries, where clarity and respect matter most. From the wheelhouse to the studio floor, we show how clients trust us to step in and deliver assets that carry their story forward.
            </p>
            <CTAButton href="/contact" label="Work With Us" />
          </div>
        </div>

        <ScrollBadge position="bottom-left" />
      </section>

      {/* Gallery Grid */}
      <section style={{ padding: "0 40px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {/* Row 1: two side by side */}
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[0]} />
          </div>
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[1]} />
          </div>

          {/* Row 2: one full width */}
          <div style={{ gridColumn: "1 / -1", aspectRatio: "2.2 / 1" }}>
            <GalleryCard study={caseStudies[2]} />
          </div>

          {/* Row 3: two side by side */}
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[3]} />
          </div>
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[4]} />
          </div>

          {/* Row 4: two side by side */}
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[5]} />
          </div>
          <div style={{ aspectRatio: "4 / 3" }}>
            <GalleryCard study={caseStudies[6]} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "120px 80px 160px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src="https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/a561f668-0ce3-4365-b3c5-61543b8647dd/pgtsnd-camera.webp"
          alt="Camera illustration"
          style={{ width: "160px", height: "auto", marginBottom: "48px", opacity: 0.9 }}
        />
        <h2
          style={f({
            fontWeight: 900,
            fontSize: "clamp(32px, 5vw, 56px)",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "#ffffff",
            marginBottom: "40px",
            maxWidth: "900px",
          })}
        >
          Your work deserves to be seen with the same care you put into it. We&rsquo;re ready to capture it right.
        </h2>
        <CTAButton href="/contact" label="Start A Project" />
      </section>

      <Footer />
    </div>
  );
}
