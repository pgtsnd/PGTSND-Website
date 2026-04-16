import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api } from "../lib/api";

const treatments: Record<string, { title: string; project: string; author: string; date: string; body: string[] }> = {
  "spring-campaign-film": {
    title: "Treatment / Creative Brief",
    project: "Spring Campaign Film",
    author: "Bri Dwyer",
    date: "February 18, 2025",
    body: [
      "Net Your Problem is not just a fishing company — it's a story about the last generation of people who know how to pull something real from the sea. This film is about hands. It's about rhythm. It's about the kind of work that starts before sunrise and doesn't ask for recognition.",
      "We open in darkness. The harbor at 4:30 AM. Fog sits heavy on the water. A single dock light cuts through it. We hear boots on wood, the clank of metal on metal, low voices. The crew is gathering. There's no rush — just purpose. These people have done this a thousand times, and that's exactly the point.",
      "The boat leaves the harbor as the first light breaks. We're shooting wide — a drone pulling back to reveal the scale of the Pacific Northwest coastline. The water is dark, almost black. The boat is small against it. This is the establishing shot that sets the tone: nature is in charge here, and these people respect that.",
      "On the water, we follow the crew through a full harvest cycle. Nets are deployed with practiced precision. There's a choreography to it — everyone knows where to stand, when to pull, how to read the current. We shoot tight on hands: calloused, scarred, strong. These aren't corporate hands. These are hands that have earned every line.",
      "The haul comes up and the energy shifts. There's urgency now. Fish need to be sorted, counted, handled with care. We capture the chaos and the precision — close-ups of the catch, water spraying, the crew working in sync. The sound design here is critical: the slap of fish, the creak of the boat, the wind.",
      "We transition to shore. The processing facility is where the product becomes the brand. Workers in clean gear moving with industrial efficiency, but there's a human scale to it. We focus on the care — how each piece is inspected, portioned, packed. This isn't a factory. It's a workshop.",
      "The final product sits in branded packaging. We shoot a hero macro: the label, the texture of the packaging, the color of the fish visible through the window. It's beautiful. It's real. It's the payoff of everything we've seen.",
      "Nicole steps into frame for the interview segment. Natural light. Shot on the 85mm to compress the background and keep the focus intimate. She speaks about her mission — sustainable fishing, supporting local crews, building something that lasts. Her passion is the emotional core of the piece.",
      "We close with a montage: the sunrise we opened with, the crew laughing on deck, the finished product on a plate, the boat heading back into harbor. The music swells — something composed, acoustic guitar with light percussion. Organic and warm, like the brand itself.",
      "The final frame: the Net Your Problem logo, clean and simple, over black. Tagline beneath. No voiceover. Just the logo and the feeling that you've just watched something real.",
      "Final deliverables: one 3-minute hero cut (16:9) for website and investor deck, plus a 60-second version and social cuts in 9:16 and 1:1 formats. All color grading to match the brand palette — cool shadows, warm highlights, desaturated but not flat. Music will be original composition, no stock."
    ],
  },
  "product-launch-teaser": {
    title: "Treatment / Creative Brief",
    project: "Product Launch Teaser",
    author: "Bri Dwyer",
    date: "March 28, 2025",
    body: [
      "This is a 60-second product launch teaser for Net Your Problem's new sustainable sablefish line. It's designed for impact — fast-paced, visually dense, and engineered for social media feeds and trade show screens where you have exactly three seconds to stop someone's thumb.",
      "We open on pure black. A single drop of water falls in slow motion — hyper-close, filling the frame. The sound is crisp, almost ASMR-quality. Then the product appears: the sablefish packaging, emerging from shadow, lit like a luxury item. This is the Apple product video approach Nicole referenced, but grittier.",
      "Quick cuts follow. Hands filleting fish. The gleam of a knife. Packaging sliding into boxes. Workers in motion on the processing floor — shot with motion blur to convey energy and scale. Every frame is composed like a photograph.",
      "We pull out to the fleet at golden hour. Drone shot: three boats in formation, the sun low on the water, silhouettes. This is the scale shot — the moment the viewer understands this isn't a hobby operation. It's an enterprise built on the water.",
      "The slow-motion water elements tie everything together. Waves crashing against the hull. Spray catching sunlight. Fish breaking the surface of the net. These are the luxury moments — the beauty shots that make the product feel premium.",
      "We end hard: the logo sting. The Net Your Problem mark animates in — clean, confident, fast. The tagline lands beneath it. Cut to black. The whole thing takes 60 seconds and leaves you wanting more.",
      "Tone: premium but rugged. Think Apple product video meets Patagonia brand film. The color grade is contrasty — deep shadows, punchy highlights. Music is electronic-organic hybrid: a driving beat with natural textures layered in.",
      "Deliverables: one 60-second master cut, plus 30-second and 15-second edits. All formats: 16:9, 9:16, 1:1. Must be delivered by June 2 for the Portland trade show."
    ],
  },
};

function resolveSlug(id: string): string {
  const staticMap: Record<string, string> = {
    "1": "spring-campaign-film",
    "2": "product-launch-teaser",
  };
  if (staticMap[id]) return staticMap[id];
  return "spring-campaign-film";
}

export default function ProjectTreatment() {
  const { t } = useTheme();
  const [, params] = useRoute("/client-hub/projects/:id/treatment");
  const projectId = params?.id || "1";
  const [slug, setSlug] = useState(resolveSlug(projectId));

  useEffect(() => {
    if (projectId.includes("-") && projectId.length > 10) {
      api.getProjects().then((projects) => {
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
          const name = project.name.toLowerCase();
          if (name.includes("spring") || name.includes("net your problem")) {
            setSlug("spring-campaign-film");
          } else if (name.includes("teaser") || name.includes("launch")) {
            setSlug("product-launch-teaser");
          }
        }
      }).catch(() => {});
    }
  }, [projectId]);

  const data = treatments[slug];
  if (!data) return null;

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "800px" }}>
        <Link href="/client-hub/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to {data.project}
        </Link>

        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "8px" }}>
          {data.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>{data.project}</span>
          <span style={{ color: t.textMuted }}>·</span>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>Written by {data.author}</span>
          <span style={{ color: t.textMuted }}>·</span>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{data.date}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {data.body.map((paragraph, i) => (
            <p key={i} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "15px", color: t.textSecondary, lineHeight: 1.85 }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "12px" }}>
          <Link href={`/client-hub/projects/${projectId}/storyboard`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            View Storyboard →
          </Link>
          <Link href={`/client-hub/projects/${projectId}/shotlist`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            View Shot List →
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
