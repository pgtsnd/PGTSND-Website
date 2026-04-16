import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api } from "../lib/api";

interface StoryboardFrame {
  scene: string;
  description: string;
  mood: string;
  camera: string;
  gradient: string;
}

const storyboards: Record<string, { project: string; frames: StoryboardFrame[] }> = {
  "spring-campaign-film": {
    project: "Spring Campaign Film",
    frames: [
      { scene: "Scene 1 — Pre-Dawn Harbor", description: "Dock at 4:30 AM. Heavy fog, single dock light cutting through. Boots on wood, metal clanking, low voices. The crew gathers with quiet purpose.", mood: "Somber, atmospheric, anticipatory", camera: "Wide establishing → handheld medium", gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
      { scene: "Scene 2 — Leaving Harbor", description: "Boat departs as first light breaks. Drone pulling back to reveal coastline. Dark water, small boat against vast ocean. Nature is in charge.", mood: "Epic, reverent, expansive", camera: "Drone wide pullback → aerial tracking", gradient: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 50%, #2c3e50 100%)" },
      { scene: "Scene 3 — On the Water", description: "The crew deploys nets with practiced precision. Everyone knows their position. Tight shots on hands — calloused, strong, earned. The choreography of work.", mood: "Focused, rhythmic, physical", camera: "Handheld close-ups → medium tracking", gradient: "linear-gradient(135deg, #3a3a3a 0%, #5a5a5a 50%, #2a2a2a 100%)" },
      { scene: "Scene 4 — The Haul", description: "Energy shifts. Fish sorted, counted, handled with care. Close-ups of catch, water spray, crew in sync. Sound: fish slapping, boat creaking, wind.", mood: "Urgent, visceral, alive", camera: "Tight close-ups → POV angles", gradient: "linear-gradient(135deg, #434343 0%, #6a6a6a 50%, #333333 100%)" },
      { scene: "Scene 5 — Processing Facility", description: "Transition to shore. Clean gear, industrial efficiency at human scale. Each piece inspected, portioned, packed. Not a factory — a workshop.", mood: "Precise, clean, purposeful", camera: "Steadicam medium → macro details", gradient: "linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #a0a0a0 100%)" },
      { scene: "Scene 6 — The Product", description: "Hero macro shot: branded packaging, texture visible, color of fish through window. Beautiful, real, the payoff of everything we've seen.", mood: "Elevated, premium, satisfying", camera: "Macro 100mm → slow dolly", gradient: "linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 50%, #1a1a1a 100%)" },
      { scene: "Scene 7 — Nicole's Interview", description: "Natural light, 85mm compression. Nicole speaks about sustainable fishing, supporting local crews, building something that lasts. The emotional core.", mood: "Intimate, honest, passionate", camera: "85mm portrait lens, shallow DOF", gradient: "linear-gradient(135deg, #3e3e3e 0%, #555555 50%, #2e2e2e 100%)" },
      { scene: "Scene 8 — Closing Montage", description: "Sunrise, crew laughing, finished product on plate, boat heading home. Music swells — composed acoustic guitar, light percussion. Logo over black.", mood: "Warm, hopeful, resolved", camera: "Mixed — montage pacing", gradient: "linear-gradient(135deg, #2c3333 0%, #44534e 50%, #2c3333 100%)" },
    ],
  },
  "product-launch-teaser": {
    project: "Product Launch Teaser",
    frames: [
      { scene: "Frame 1 — The Drop", description: "Pure black. Single water drop in slow motion, hyper-close. Sound is crisp, ASMR-quality. The product emerges from shadow, lit like luxury.", mood: "Mysterious, premium, arresting", camera: "Macro lens, controlled studio light", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)" },
      { scene: "Frame 2 — Quick Cuts", description: "Hands filleting. Knife gleam. Packaging into boxes. Workers in motion blur on processing floor. Every frame composed like a photograph.", mood: "Energetic, precise, dynamic", camera: "Quick cuts, varied focal lengths", gradient: "linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 50%, #1d1d1d 100%)" },
      { scene: "Frame 3 — The Fleet", description: "Pull out to golden hour. Drone: three boats in formation, sun low, silhouettes. This is the scale moment — an enterprise built on water.", mood: "Majestic, ambitious, warm", camera: "Drone wide, golden hour backlight", gradient: "linear-gradient(135deg, #4a3728 0%, #6a4f3a 50%, #3a2a1e 100%)" },
      { scene: "Frame 4 — Water Elements", description: "Slow-motion beauty shots. Waves on hull. Spray catching sunlight. Fish breaking net surface. The luxury moments that sell the premium.", mood: "Beautiful, tactile, aspirational", camera: "High-speed 120fps, backlit", gradient: "linear-gradient(135deg, #1a3040 0%, #2a4a5a 50%, #1a3040 100%)" },
      { scene: "Frame 5 — Logo Sting", description: "Hard cut to black. Logo animates in — clean, confident, fast. Tagline lands beneath. 60 seconds. Leaves you wanting more.", mood: "Confident, decisive, final", camera: "Motion graphics / composited", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #000000 100%)" },
    ],
  },
};

function resolveSlug(id: string): string {
  const staticMap: Record<string, string> = { "1": "spring-campaign-film", "2": "product-launch-teaser" };
  if (staticMap[id]) return staticMap[id];
  return "spring-campaign-film";
}

export default function ProjectStoryboard() {
  const { t } = useTheme();
  const [, params] = useRoute("/client-hub/projects/:id/storyboard");
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

  const data = storyboards[slug];
  if (!data) return null;

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <Link href="/client-hub/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to {data.project}
        </Link>

        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "8px" }}>Storyboard</h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary, marginBottom: "36px" }}>
          Visual mood reference for each scene — {data.frames.length} frames
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {data.frames.map((frame, i) => (
            <div key={i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ height: "180px", background: frame.gradient, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "48px", color: "rgba(255,255,255,0.08)" }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ position: "absolute", bottom: "12px", left: "16px", display: "flex", gap: "6px" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "4px" }}>{frame.mood}</span>
                </div>
              </div>
              <div style={{ padding: "20px" }}>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "14px", color: t.text, marginBottom: "8px" }}>{frame.scene}</h3>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textSecondary, lineHeight: 1.7, marginBottom: "14px" }}>{frame.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{frame.camera}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "12px" }}>
          <Link href={`/client-hub/projects/${projectId}/treatment`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            ← Treatment
          </Link>
          <Link href={`/client-hub/projects/${projectId}/shotlist`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            Shot List →
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
