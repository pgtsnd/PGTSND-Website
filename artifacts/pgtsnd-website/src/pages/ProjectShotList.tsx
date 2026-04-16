import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";
import { api } from "../lib/api";

interface Shot {
  id: string;
  scene: string;
  type: "hero" | "broll" | "interview" | "aerial" | "macro" | "slo-mo";
  description: string;
  lens: string;
  movement: string;
  notes?: string;
  captured: boolean;
}

const shotLists: Record<string, { project: string; shots: Shot[] }> = {
  "spring-campaign-film": {
    project: "Spring Campaign Film",
    shots: [
      { id: "SCF-001", scene: "Harbor — Pre-Dawn", type: "aerial", description: "Wide establishing — harbor at sunrise", lens: "24mm (drone)", movement: "Slow pullback reveal", captured: true },
      { id: "SCF-002", scene: "Harbor — Pre-Dawn", type: "broll", description: "Crew prepping gear on deck", lens: "35mm", movement: "Handheld, observational", captured: true },
      { id: "SCF-003", scene: "Harbor — Pre-Dawn", type: "macro", description: "Hands tying nets, coiling rope", lens: "85mm macro", movement: "Static, shallow DOF", captured: true },
      { id: "SCF-004", scene: "Harbor — Pre-Dawn", type: "broll", description: "Dock light through fog", lens: "50mm", movement: "Locked tripod", captured: true },
      { id: "SCF-005", scene: "On the Water", type: "aerial", description: "Boat leaving harbor — tracking shot", lens: "24mm (drone)", movement: "Tracking alongside", captured: true },
      { id: "SCF-006", scene: "On the Water", type: "hero", description: "Nets deployed — wide shot of crew working", lens: "24mm", movement: "Steadicam orbit", captured: true },
      { id: "SCF-007", scene: "On the Water", type: "broll", description: "POV — nets hitting water surface", lens: "16mm", movement: "POV mounted", notes: "Waterproof housing needed", captured: true },
      { id: "SCF-008", scene: "On the Water", type: "macro", description: "Fish in nets, water spray detail", lens: "100mm macro", movement: "Handheld close", captured: true },
      { id: "SCF-009", scene: "On the Water", type: "slo-mo", description: "Spray catching sunlight — beauty shot", lens: "85mm", movement: "Static, 120fps", captured: true },
      { id: "SCF-010", scene: "On the Water", type: "broll", description: "Crew pulling nets, teamwork sequence", lens: "35mm", movement: "Handheld tracking", captured: true },
      { id: "SCF-011", scene: "Processing Facility", type: "hero", description: "Wide — processing floor, workers in motion", lens: "24mm", movement: "Steadicam walk-through", captured: true },
      { id: "SCF-012", scene: "Processing Facility", type: "macro", description: "Hands inspecting and portioning fish", lens: "100mm macro", movement: "Slider, slow push", captured: true },
      { id: "SCF-013", scene: "Processing Facility", type: "broll", description: "Packaging line — product being sealed", lens: "50mm", movement: "Static + rack focus", captured: true },
      { id: "SCF-014", scene: "Product", type: "hero", description: "Hero macro — brand label on final product", lens: "100mm macro", movement: "Slow dolly in", notes: "Use product styling kit", captured: false },
      { id: "SCF-015", scene: "Product", type: "macro", description: "Texture of packaging, fish visible through window", lens: "100mm macro", movement: "Static, controlled lighting", captured: false },
      { id: "SCF-016", scene: "Interview", type: "interview", description: "Nicole — medium close-up, natural light", lens: "85mm", movement: "Locked tripod", notes: "Background: harbor, soft focus", captured: true },
      { id: "SCF-017", scene: "Interview", type: "interview", description: "Nicole — wide, environmental portrait", lens: "35mm", movement: "Static", captured: true },
      { id: "SCF-018", scene: "B-Roll General", type: "broll", description: "Team laughing, candid moments on deck", lens: "85mm", movement: "Handheld, long lens compression", captured: true },
      { id: "SCF-019", scene: "B-Roll General", type: "broll", description: "Sunrise / sunset time transitions", lens: "24mm", movement: "Locked tripod, timelapse", captured: true },
      { id: "SCF-020", scene: "B-Roll General", type: "aerial", description: "Coastline establishing — scale of PNW", lens: "24mm (drone)", movement: "Slow forward push", captured: true },
      { id: "SCF-021", scene: "B-Roll General", type: "slo-mo", description: "Water surface texture, light play", lens: "100mm", movement: "Static, 240fps", captured: false },
      { id: "SCF-022", scene: "B-Roll General", type: "broll", description: "Boat engine starting, exhaust, vibration", lens: "50mm", movement: "Handheld", captured: true },
    ],
  },
  "product-launch-teaser": {
    project: "Product Launch Teaser",
    shots: [
      { id: "PLT-001", scene: "Studio", type: "macro", description: "Product packaging — shallow DOF reveal", lens: "100mm macro", movement: "Slow dolly, controlled light", notes: "Black background, single key light", captured: false },
      { id: "PLT-002", scene: "Studio", type: "slo-mo", description: "Water drop onto product — hero moment", lens: "100mm macro", movement: "Static, 240fps", captured: false },
      { id: "PLT-003", scene: "Processing", type: "macro", description: "Hands filleting, knife gleam", lens: "85mm", movement: "Handheld close", captured: false },
      { id: "PLT-004", scene: "Processing", type: "broll", description: "Packaging sliding into boxes", lens: "50mm", movement: "Slider push", captured: false },
      { id: "PLT-005", scene: "Processing", type: "hero", description: "Warehouse floor, workers in motion blur", lens: "24mm", movement: "Long exposure pan", captured: false },
      { id: "PLT-006", scene: "Fleet", type: "aerial", description: "Three boats in formation, golden hour", lens: "24mm (drone)", movement: "Orbiting wide", captured: false },
      { id: "PLT-007", scene: "Fleet", type: "aerial", description: "Silhouette pull-back, sun on water", lens: "24mm (drone)", movement: "Pullback reveal", captured: false },
      { id: "PLT-008", scene: "Water Elements", type: "slo-mo", description: "Waves crashing against hull", lens: "85mm", movement: "Static, 120fps", captured: false },
      { id: "PLT-009", scene: "Water Elements", type: "slo-mo", description: "Fish breaking net surface", lens: "100mm", movement: "Handheld, 240fps", captured: false },
      { id: "PLT-010", scene: "Water Elements", type: "slo-mo", description: "Spray catching sunlight — backlit", lens: "85mm", movement: "Static, backlit, 120fps", captured: false },
    ],
  },
};

const typeColors: Record<string, { label: string }> = {
  hero: { label: "HERO" },
  broll: { label: "B-ROLL" },
  interview: { label: "INTERVIEW" },
  aerial: { label: "AERIAL" },
  macro: { label: "MACRO" },
  "slo-mo": { label: "SLO-MO" },
};

function resolveSlug(id: string): string {
  const staticMap: Record<string, string> = { "1": "spring-campaign-film", "2": "product-launch-teaser" };
  if (staticMap[id]) return staticMap[id];
  return "spring-campaign-film";
}

export default function ProjectShotList() {
  const { t } = useTheme();
  const [, params] = useRoute("/client-hub/projects/:id/shotlist");
  const projectId = params?.id || "1";
  const [slug, setSlug] = useState(resolveSlug(projectId));
  const [filterScene, setFilterScene] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

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

  const data = shotLists[slug];
  if (!data) return null;

  const scenes = Array.from(new Set(data.shots.map((s) => s.scene)));
  const types = Array.from(new Set(data.shots.map((s) => s.type)));

  const filtered = data.shots.filter((s) => {
    if (filterScene !== "all" && s.scene !== filterScene) return false;
    if (filterType !== "all" && s.type !== filterType) return false;
    return true;
  });

  const capturedCount = data.shots.filter((s) => s.captured).length;

  const groupedByScene: Record<string, Shot[]> = {};
  filtered.forEach((shot) => {
    if (!groupedByScene[shot.scene]) groupedByScene[shot.scene] = [];
    groupedByScene[shot.scene].push(shot);
  });

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1100px" }}>
        <Link href="/client-hub/projects" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to {data.project}
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "8px" }}>Shot List</h1>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: t.textTertiary }}>
              {data.shots.length} planned shots · {capturedCount} captured · {data.shots.length - capturedCount} remaining
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "120px", height: "4px", background: t.border, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${(capturedCount / data.shots.length) * 100}%`, height: "100%", background: t.text, borderRadius: "2px" }} />
            </div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "12px", color: t.textTertiary }}>{Math.round((capturedCount / data.shots.length) * 100)}%</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted }}>Scene:</span>
            <select value={filterScene} onChange={(e) => setFilterScene(e.target.value)} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.text, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
              <option value="all">All Scenes</option>
              {scenes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted }}>Type:</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.text, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
              <option value="all">All Types</option>
              {types.map((tp) => <option key={tp} value={tp}>{typeColors[tp]?.label || tp}</option>)}
            </select>
          </div>
        </div>

        {Object.entries(groupedByScene).map(([scene, shots]) => (
          <div key={scene} style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: t.textTertiary }}>{scene}</h3>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{shots.length} shots</span>
            </div>

            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 130px 140px 60px", padding: "10px 20px", borderBottom: `1px solid ${t.border}` }}>
                {["ID", "TYPE", "DESCRIPTION", "LENS", "MOVEMENT", ""].map((h) => (
                  <span key={h} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>{h}</span>
                ))}
              </div>
              {shots.map((shot, i) => (
                <div key={shot.id} style={{ display: "grid", gridTemplateColumns: "60px 80px 1fr 130px 140px 60px", padding: "14px 20px", borderBottom: i < shots.length - 1 ? `1px solid ${t.borderSubtle}` : "none", alignItems: "center", opacity: shot.captured ? 0.5 : 1 }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "11px", color: t.textMuted }}>{shot.id.split("-")[1]}</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.04em", color: t.textTertiary, background: t.hoverBg, padding: "3px 8px", borderRadius: "3px", justifySelf: "start" }}>{typeColors[shot.type]?.label}</span>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "13px", color: t.text, textDecoration: shot.captured ? "line-through" : "none", marginBottom: shot.notes ? "4px" : "0" }}>{shot.description}</p>
                    {shot.notes && <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted, fontStyle: "italic" }}>{shot.notes}</p>}
                  </div>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{shot.lens}</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textTertiary }}>{shot.movement}</span>
                  <div style={{ justifySelf: "center" }}>
                    {shot.captured ? (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: t.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    ) : (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1.5px solid ${t.border}` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "12px" }}>
          <Link href={`/client-hub/projects/${projectId}/storyboard`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            ← Storyboard
          </Link>
          <Link href={`/client-hub/projects/${projectId}/notes`} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary, textDecoration: "none", padding: "8px 16px", border: `1px solid ${t.border}`, borderRadius: "6px" }}>
            Client Notes →
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
