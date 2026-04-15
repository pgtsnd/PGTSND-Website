import { useState } from "react";
import CTAButton from "../components/CTAButton";
import ScrollBadge from "../components/ScrollBadge";
import Footer from "../components/Footer";

const f = (s: React.CSSProperties): React.CSSProperties => ({ fontFamily: "'Montserrat', sans-serif", ...s });

const BASE = import.meta.env.BASE_URL;

const caseStudies = [
  {
    client: "Alaska Bering Sea Crabbers",
    category: "Documentary + Photography",
    description:
      "Documenting a season of commercial crabbing required us to be fully embedded with the crew — early mornings, rough seas, and all. The result was an authentic portrait of the industry.",
    image: `${BASE}images/catch-close-pgtsnd-bri-dwyer.jpeg`,
  },
  {
    client: "Vallation Outerwear",
    category: "Photography",
    description:
      "From the start, PGTSND worked with Vallation on their goals for what they wanted to accomplish, and within the parameters they set.",
    image: `${BASE}images/fisherman-hands-close-pgtsnd-bri-dwyer.jpeg`,
  },
  {
    client: "Green Juju",
    category: "Full Production Suite +",
    description:
      "Green Juju needed a refreshed digital presence to reflect their growth and mission. We developed a full suite of video and photography assets.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/d9460e68-5cd2-4c0f-94e1-1882061a71e3/green-juju-dog-kitchen-pgtsnd.jpeg",
  },
  {
    client: "Net Your Problem",
    category: "Brand Film",
    description:
      "A commercial fishing technology startup needed compelling video assets to present at industry conferences and help recruit new partners.",
    image: `${BASE}images/crabs-pelican-pgtsnd-bri-dwyer.jpeg`,
  },
  {
    client: "Pacific Coast Fisheries",
    category: "On-Location Photography",
    description:
      "Sweeping on-location production combined to tell the full story of the hard-working crews behind Pacific Coast's commercial fishing operations.",
    image: `${BASE}images/foggy-fishing-coast-pgtsnd.jpeg`,
  },
  {
    client: "Lodge @ 58 North",
    category: "Video Production | Photography",
    description:
      "A complete visual overhaul — from on-the-water photography to plated culinary shots that showcase the product at every stage.",
    image:
      "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5/93006ba2-8cb2-4602-994e-d06460bddefb/nw-sablefish-pgtsnd-photography-7.jpeg",
  },
  {
    client: "NW Sablefish",
    category: "Documentary Photography",
    description:
      "An incredible collection of images capturing the gear, grit, and community behind the catch.",
    image: `${BASE}images/boats-inlet-pgtsnd-bri-dwyer.jpeg`,
  },
];

function GalleryCard({ study, height }: { study: typeof caseStudies[0]; height: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", overflow: "hidden", cursor: "pointer", height }}
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
          transition: "transform 0.6s ease",
          transform: hovered ? "scale(1.03)" : "scale(1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        <h3 style={f({
          fontWeight: 900,
          fontSize: "clamp(28px, 3.5vw, 44px)",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "#ffffff",
          marginBottom: "16px",
        })}>
          {study.client}
        </h3>
        <p style={f({
          fontWeight: 400,
          fontSize: "14px",
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "0.03em",
        })}>
          {study.category}
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
            gridTemplateColumns: "3fr 2fr",
            gap: "60px",
            alignItems: "end",
          }}
        >
          <div>
            <h1
              style={f({
                fontWeight: 900,
                fontSize: "clamp(48px, 6.5vw, 84px)",
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
                color: "#ffffff",
                whiteSpace: "nowrap",
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

        <ScrollBadge position="bottom-left" bottomOffset={-43} />
      </section>

      {/* Gallery Grid — full-bleed massive images */}
      <section style={{ padding: "0 10px" }}>
        {/* Row 1: two side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <GalleryCard study={caseStudies[0]} height="50vh" />
          <GalleryCard study={caseStudies[1]} height="50vh" />
        </div>

        {/* Row 2: one full width */}
        <div style={{ marginBottom: "10px" }}>
          <GalleryCard study={caseStudies[2]} height="65vh" />
        </div>

        {/* Row 3: two side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <GalleryCard study={caseStudies[3]} height="55vh" />
          <GalleryCard study={caseStudies[4]} height="55vh" />
        </div>

        {/* Row 4: two side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <GalleryCard study={caseStudies[5]} height="55vh" />
          <GalleryCard study={caseStudies[6]} height="55vh" />
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "160px 80px 180px",
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
