import { useState, useRef, useEffect } from "react";
import { Link, useRoute } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface ProjectData {
  id: number;
  name: string;
  client: string;
  clientCompany: string;
  status: "active" | "paused" | "completed";
  phase: string;
  progress: number;
  startDate: string;
  dueDate: string;
  team: { name: string; role: string; initials: string }[];
  treatment: string;
  storyboardScenes: { id: number; scene: string; description: string; mood: string; imageUrl: string }[];
  shots: { id: number; scene: string; shot: string; type: string; lens: string; movement: string; description: string; captured: boolean }[];
  reviewQueue: { title: string; status: "pending" | "approved" | "changes_requested"; sentAt: string; comments: number }[];
}

const projectsData: Record<string, ProjectData> = {
  "1": {
    id: 1, name: "Spring Campaign Film", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Post-Production", progress: 55, startDate: "Mar 1, 2025", dueDate: "May 15, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Marcus Cole", role: "DP", initials: "MC" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
      { name: "Kandice M.", role: "PM", initials: "KM" },
    ],
    treatment: `# Spring Campaign Film — Treatment\n\n## Concept\nA cinematic brand film capturing the energy and mission of Net Your Problem's spring product launch. The film follows a day-in-the-life narrative structure, weaving together interviews with the founding team and dynamic product footage.\n\n## Tone & Style\nWarm, energetic, aspirational. Think **Apple "Shot on iPhone"** meets **Patagonia brand films**. Natural light where possible, handheld for interviews, stabilized for product beauty shots.\n\n## Structure\n\n### Act 1 — The Problem (0:00–0:30)\nOpen on close-up details of everyday frustration. Quick cuts. No dialogue — just ambient sound and a building score. We feel the tension before we understand it.\n\n### Act 2 — The People (0:30–1:30)\nMeet the team. Candid interviews intercut with them at work. Nicole speaks about why she started the company. Marcus shows the product prototype. Real moments, not scripted.\n\n### Act 3 — The Solution (1:30–2:30)\nProduct reveal. Beautiful macro shots of the product in use. Slow motion water, light flares. The score peaks. We see the transformation — from problem to solution.\n\n### Act 4 — The Future (2:30–3:00)\nWide establishing shots. The team together. A final line from Nicole about what's next. Logo. End.\n\n## Key Deliverables\n- 3-minute hero film\n- 30-second social cut\n- 15-second teaser\n- Behind-the-scenes photo set`,
    storyboardScenes: [
      { id: 1, scene: "Scene 1 — Opening", description: "Close-up details: hands on keyboard, coffee steam, phone notifications. Quick cuts building tension.", mood: "Tense, modern", imageUrl: "" },
      { id: 2, scene: "Scene 2 — Nicole Interview", description: "Nicole at her desk, natural light from window. Talking about the origin story. Shallow depth of field.", mood: "Intimate, warm", imageUrl: "" },
      { id: 3, scene: "Scene 3 — Team at Work", description: "Montage: whiteboard sessions, laptop screens, team laughing. Handheld, energetic movement.", mood: "Energetic, candid", imageUrl: "" },
      { id: 4, scene: "Scene 4 — Product Reveal", description: "Hero product shot on clean surface. Water droplets, light flares. Macro lens. Slow dolly push.", mood: "Premium, aspirational", imageUrl: "" },
      { id: 5, scene: "Scene 5 — Product in Use", description: "Real people using the product in daily life. Street scenes, home office, cafe. Natural and authentic.", mood: "Authentic, relatable", imageUrl: "" },
      { id: 6, scene: "Scene 6 — The Future", description: "Golden hour wide shots. Team walking together. Nicole's closing words. Logo fade.", mood: "Hopeful, cinematic", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Scene 1", shot: "1A", type: "Macro", lens: "100mm", movement: "Static", description: "Fingers typing on keyboard, shallow DOF", captured: true },
      { id: 2, scene: "Scene 1", shot: "1B", type: "Macro", lens: "100mm", movement: "Slider", description: "Coffee steam rising, backlit", captured: true },
      { id: 3, scene: "Scene 1", shot: "1C", type: "B-Roll", lens: "35mm", movement: "Handheld", description: "Phone screen with notifications", captured: false },
      { id: 4, scene: "Scene 2", shot: "2A", type: "Interview", lens: "85mm", movement: "Static", description: "Nicole medium close-up, natural window light", captured: true },
      { id: 5, scene: "Scene 2", shot: "2B", type: "B-Roll", lens: "35mm", movement: "Handheld", description: "Nicole's hands gesturing while talking", captured: true },
      { id: 6, scene: "Scene 3", shot: "3A", type: "B-Roll", lens: "24mm", movement: "Handheld", description: "Wide: team around whiteboard", captured: true },
      { id: 7, scene: "Scene 3", shot: "3B", type: "B-Roll", lens: "50mm", movement: "Handheld", description: "Over-shoulder: laptop screen with designs", captured: false },
      { id: 8, scene: "Scene 4", shot: "4A", type: "Hero", lens: "100mm", movement: "Dolly", description: "Product hero — clean surface, slow push in", captured: false },
      { id: 9, scene: "Scene 4", shot: "4B", type: "Macro", lens: "100mm", movement: "Static", description: "Water droplets on product surface", captured: false },
      { id: 10, scene: "Scene 4", shot: "4C", type: "Hero", lens: "50mm", movement: "Slider", description: "Product with light flares, angled", captured: false },
      { id: 11, scene: "Scene 5", shot: "5A", type: "B-Roll", lens: "35mm", movement: "Handheld", description: "Person using product at cafe", captured: false },
      { id: 12, scene: "Scene 5", shot: "5B", type: "B-Roll", lens: "50mm", movement: "Steadicam", description: "Walking shot: product in hand, street", captured: false },
      { id: 13, scene: "Scene 6", shot: "6A", type: "Hero", lens: "24mm", movement: "Drone", description: "Golden hour aerial establishing shot", captured: false },
      { id: 14, scene: "Scene 6", shot: "6B", type: "Interview", lens: "85mm", movement: "Static", description: "Nicole closing statement, warm light", captured: false },
    ],
    reviewQueue: [
      { title: "Rough Cut v2", status: "pending", sentAt: "2 hours ago", comments: 0 },
      { title: "Rough Cut v1", status: "changes_requested", sentAt: "5 days ago", comments: 7 },
    ],
  },
  "2": {
    id: 2, name: "Product Launch Teaser", client: "Nicole Baker", clientCompany: "Net Your Problem",
    status: "active", phase: "Production", progress: 30, startDate: "Apr 1, 2025", dueDate: "Jun 2, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Sam Reeves", role: "DP", initials: "SR" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
    ],
    treatment: `# Product Launch Teaser — Treatment\n\n## Concept\nA 30-second teaser that builds anticipation for Net Your Problem's new product line. Pure visual storytelling — no dialogue, no text until the final reveal.\n\n## Approach\nExtreme close-ups and macro photography. Water, light, texture. The product is the star. We never see it fully until the final frame.\n\n## Shot Sequence\n1. Black screen → single water droplet falls\n2. Macro: product texture emerges from shadow\n3. Light sweeps across surface\n4. Quick cuts: hands, water, light\n5. Full product reveal\n6. Logo + date`,
    storyboardScenes: [
      { id: 1, scene: "Shot 1 — Water Drop", description: "Single water droplet falling in slow motion against black. 120fps.", mood: "Minimal, dramatic", imageUrl: "" },
      { id: 2, scene: "Shot 2 — Texture Reveal", description: "Macro shot of product surface emerging from shadow. Slow light sweep.", mood: "Mysterious, premium", imageUrl: "" },
      { id: 3, scene: "Shot 3 — Full Reveal", description: "Product fully lit on clean surface. Hero shot. Logo fade in.", mood: "Bold, confident", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Shot 1", shot: "T1", type: "Macro", lens: "100mm", movement: "Static", description: "Water droplet, 120fps, black bg", captured: true },
      { id: 2, scene: "Shot 2", shot: "T2", type: "Macro", lens: "100mm", movement: "Slider", description: "Product texture, slow light sweep", captured: true },
      { id: 3, scene: "Shot 3", shot: "T3", type: "Hero", lens: "50mm", movement: "Dolly", description: "Full product reveal, clean surface", captured: false },
    ],
    reviewQueue: [],
  },
  "3": {
    id: 3, name: "Brand Story — Founders Cut", client: "Marcus Tran", clientCompany: "Tran Architecture",
    status: "paused", phase: "Pre-Production", progress: 15, startDate: "Jan 15, 2025", dueDate: "TBD",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Marcus Cole", role: "DP", initials: "MC" },
    ],
    treatment: `# Brand Story — Founders Cut\n\n## Concept\nA documentary-style brand film exploring Marcus Tran's journey from architecture student to founding his own firm. The film celebrates craftsmanship, vision, and the intersection of art and structure.\n\n## Tone\nQuiet confidence. Lots of natural light, wide architectural shots, and intimate close-ups of hands at work. Think Jiro Dreams of Sushi meets architectural photography.`,
    storyboardScenes: [
      { id: 1, scene: "Scene 1 — The Studio", description: "Marcus at his drafting table, early morning light. Quiet, focused.", mood: "Contemplative", imageUrl: "" },
      { id: 2, scene: "Scene 2 — The Build", description: "Construction site. Steel, concrete, blueprints. The vision becoming real.", mood: "Industrial, honest", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Scene 1", shot: "1A", type: "Interview", lens: "85mm", movement: "Static", description: "Marcus at drafting table, window light", captured: true },
      { id: 2, scene: "Scene 1", shot: "1B", type: "Macro", lens: "100mm", movement: "Slider", description: "Pencil on paper, architectural sketches", captured: true },
      { id: 3, scene: "Scene 2", shot: "2A", type: "B-Roll", lens: "24mm", movement: "Steadicam", description: "Walk through construction site", captured: true },
    ],
    reviewQueue: [],
  },
  "4": {
    id: 4, name: "Annual Report Video", client: "Sarah Chen", clientCompany: "Pacific Northwest Health",
    status: "completed" as const, phase: "Delivered", progress: 100, startDate: "Nov 1, 2024", dueDate: "Jan 20, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
    ],
    treatment: `# Annual Report Video\n\n## Overview\nA 5-minute recap of Pacific Northwest Health's 2024 achievements, patient stories, and community impact. Clean, professional, warm.\n\n## Deliverables\n- 5-minute hero film\n- 90-second social cut\n- Individual patient story clips (3)`,
    storyboardScenes: [
      { id: 1, scene: "Opening — Year in Review", description: "Montage of key moments from 2024. Staff, patients, facilities.", mood: "Warm, hopeful", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Opening", shot: "1A", type: "B-Roll", lens: "35mm", movement: "Steadicam", description: "Hospital hallway, staff walking", captured: true },
    ],
    reviewQueue: [
      { title: "Final Delivery", status: "approved" as const, sentAt: "Jan 18", comments: 2 },
    ],
  },
  "5": {
    id: 5, name: "Investor Deck Video", client: "Sarah Chen", clientCompany: "Pacific Northwest Health",
    status: "completed" as const, phase: "Delivered", progress: 100, startDate: "Dec 10, 2024", dueDate: "Feb 1, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Sam Reeves", role: "DP", initials: "SR" },
    ],
    treatment: `# Investor Deck Video\n\n## Purpose\nA 2-minute companion video for PNW Health's Series B investor deck. Data-driven visuals, clean motion graphics, confident narration.`,
    storyboardScenes: [
      { id: 1, scene: "Data Visualization", description: "Animated charts and graphs. Clean white backgrounds, blue accents.", mood: "Professional, confident", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Intro", shot: "1A", type: "B-Roll", lens: "50mm", movement: "Static", description: "CEO at podium, investor event", captured: true },
    ],
    reviewQueue: [
      { title: "Final Cut", status: "approved" as const, sentAt: "Jan 30", comments: 0 },
    ],
  },
  "6": {
    id: 6, name: "Social Media Package", client: "Lena Park", clientCompany: "Cascade Coffee Co.",
    status: "completed" as const, phase: "Delivered", progress: 100, startDate: "Aug 1, 2024", dueDate: "Sep 15, 2024",
    team: [
      { name: "Bri Dwyer", role: "Director", initials: "BD" },
      { name: "Marcus Cole", role: "DP", initials: "MC" },
    ],
    treatment: `# Social Media Package — Cascade Coffee\n\n## Overview\n12 short-form videos for Instagram Reels and TikTok. Each 15-30 seconds. Focus on latte art, barista craft, and the cafe atmosphere.`,
    storyboardScenes: [
      { id: 1, scene: "Latte Art Series", description: "Top-down shots of latte art being poured. Multiple designs.", mood: "Satisfying, artisan", imageUrl: "" },
    ],
    shots: [
      { id: 1, scene: "Latte Art", shot: "1A", type: "Macro", lens: "100mm", movement: "Static", description: "Top-down latte pour", captured: true },
    ],
    reviewQueue: [
      { title: "Full Package", status: "approved" as const, sentAt: "Sep 12, 2024", comments: 4 },
    ],
  },
};

type Tab = "overview" | "treatment" | "storyboard" | "shotlist" | "files" | "review";

export default function TeamProjectDetail() {
  const { t } = useTheme();
  const [, params] = useRoute("/team/projects/:id");
  const project = projectsData[params?.id || "1"];
  const projectId = params?.id || "1";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [treatmentText, setTreatmentText] = useState(project?.treatment || "");
  const [scenes, setScenes] = useState(project?.storyboardScenes || []);
  const [shots, setShots] = useState(project?.shots || []);
  const [editingShot, setEditingShot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setTreatmentText(project.treatment);
      setScenes(project.storyboardScenes);
      setShots(project.shots);
      setActiveTab("overview");
      setEditingShot(null);
    }
  }, [projectId]);

  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (!project) return (
    <TeamLayout>
      <div style={{ padding: "40px 48px" }}>
        <Link href="/team/projects" style={f({ fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none" })}>← Back to Projects</Link>
        <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textTertiary, marginTop: "24px" })}>Project not found.</p>
      </div>
    </TeamLayout>
  );

  const capturedCount = shots.filter(s => s.captured).length;

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "treatment", label: "Treatment" },
    { key: "storyboard", label: "Storyboard", badge: `${scenes.length}` },
    { key: "shotlist", label: "Shot List", badge: `${capturedCount}/${shots.length}` },
    { key: "files", label: "Files" },
    { key: "review", label: "Review", badge: project.reviewQueue.filter(r => r.status === "pending").length > 0 ? `${project.reviewQueue.filter(r => r.status === "pending").length}` : undefined },
  ];

  const handleImageUpload = (sceneId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl: url } : s));
      }
    };
    input.click();
  };

  return (
    <TeamLayout>
      <div style={{ padding: "32px 48px", maxWidth: "1200px" }}>
        <Link href="/team/projects" style={f({
          fontWeight: 500, fontSize: "12px", color: t.textMuted, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px",
        })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Projects
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>{project.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {project.team.map((m) => (
              <div key={m.initials} title={`${m.name} — ${m.role}`} style={{
                width: "30px", height: "30px", borderRadius: "50%", background: t.activeNav,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...f({ fontWeight: 700, fontSize: "9px", color: t.textTertiary }),
                border: `2px solid ${t.bg}`, marginLeft: "-4px",
              }}>{m.initials}</div>
            ))}
          </div>
        </div>
        <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "24px" })}>
          {project.clientCompany} · {project.phase} · Due {project.dueDate}
        </p>

        <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${t.border}`, marginBottom: "28px" }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              ...f({
                fontWeight: activeTab === tab.key ? 600 : 400, fontSize: "13px",
                color: activeTab === tab.key ? t.text : t.textMuted,
              }),
              background: "transparent", border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${t.accent}` : "2px solid transparent",
              padding: "12px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              {tab.label}
              {tab.badge && (
                <span style={f({
                  fontWeight: 500, fontSize: "10px",
                  color: tab.key === "review" && project.reviewQueue.some(r => r.status === "pending") ? "rgba(255,200,60,0.9)" : t.textMuted,
                  background: tab.key === "review" && project.reviewQueue.some(r => r.status === "pending") ? "rgba(255,200,60,0.08)" : t.hoverBg,
                  padding: "2px 8px", borderRadius: "10px",
                })}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "32px" }}>
              {[
                { label: "Progress", value: `${project.progress}%`, onClick: () => setActiveTab("shotlist") },
                { label: "Phase", value: project.phase },
                { label: "Shots Captured", value: `${capturedCount}/${shots.length}`, onClick: () => setActiveTab("shotlist") },
                { label: "Pending Reviews", value: `${project.reviewQueue.filter(r => r.status === "pending").length}`, onClick: () => setActiveTab("review") },
              ].map((stat) => (
                <div key={stat.label} onClick={stat.onClick} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "20px", cursor: stat.onClick ? "pointer" : "default",
                }}>
                  <p style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>{stat.value}</p>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>{stat.label}</p>
                </div>
              ))}
            </div>

            <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
              Jump into work
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
              {[
                { label: "Edit Treatment", desc: "Write & refine the creative brief", tab: "treatment" as Tab, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
                { label: "Build Storyboard", desc: "Upload reference images per scene", tab: "storyboard" as Tab, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
                { label: "Shot List", desc: `${shots.length - capturedCount} shots remaining`, tab: "shotlist" as Tab, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg> },
              ].map((item) => (
                <button key={item.label} onClick={() => setActiveTab(item.tab)} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "24px 20px", cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ marginBottom: "12px" }}>{item.icon}</div>
                  <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text, marginBottom: "4px" })}>{item.label}</p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{item.desc}</p>
                </button>
              ))}
            </div>

            {project.reviewQueue.length > 0 && (
              <>
                <h3 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "12px" })}>
                  Client Review
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {project.reviewQueue.map((item, i) => {
                    const isPending = item.status === "pending";
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                        borderLeft: isPending ? "3px solid rgba(255,200,60,0.8)" : `3px solid ${t.border}`,
                      }}>
                        <div>
                          <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text })}>{item.title}</p>
                          <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>Sent {item.sentAt}{item.comments > 0 ? ` · ${item.comments} comments` : ""}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={f({
                            fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em",
                            color: isPending ? "rgba(255,200,60,0.9)" : t.textMuted,
                            background: isPending ? "rgba(255,200,60,0.08)" : t.hoverBg,
                            padding: "4px 12px", borderRadius: "4px",
                          })}>{isPending ? "Awaiting Review" : "Changes Requested"}</span>
                          {isPending && (
                            <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer" })}>
                              Nudge
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "treatment" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Treatment / Creative Brief</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>The written vision for the project. Edit directly below.</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 14px", cursor: "pointer" })}>
                  Share with Client
                </button>
                <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer" })}>
                  Save
                </button>
              </div>
            </div>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: "4px" }}>
                {["B", "I", "H1", "H2", "•", "—"].map((btn) => (
                  <button key={btn} style={f({
                    fontWeight: btn === "B" ? 700 : btn === "I" ? 400 : 600,
                    fontStyle: btn === "I" ? "italic" : "normal",
                    fontSize: "12px", color: t.textMuted, background: "transparent",
                    border: `1px solid ${t.borderSubtle}`, borderRadius: "4px",
                    padding: "4px 10px", cursor: "pointer", minWidth: "32px",
                  })}>{btn}</button>
                ))}
              </div>
              <textarea
                value={treatmentText}
                onChange={(e) => setTreatmentText(e.target.value)}
                style={f({
                  fontWeight: 400, fontSize: "14px", color: t.text,
                  background: "transparent", border: "none", outline: "none",
                  width: "100%", minHeight: "600px", padding: "24px",
                  lineHeight: 1.8, resize: "vertical",
                  boxSizing: "border-box" as const,
                })}
              />
            </div>
          </div>
        )}

        {activeTab === "storyboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Storyboard</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Upload reference images and describe each scene.</p>
              </div>
              <button onClick={() => setScenes(prev => [...prev, { id: Date.now(), scene: `Scene ${prev.length + 1}`, description: "", mood: "", imageUrl: "" }])}
                style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Scene
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {scenes.map((scene, idx) => (
                <div key={scene.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <button
                    type="button"
                    aria-label={`Upload image for ${scene.scene}`}
                    onClick={() => handleImageUpload(scene.id)}
                    style={{
                      height: "200px", width: "100%", background: scene.imageUrl ? `url(${scene.imageUrl}) center/cover` : t.hoverBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", position: "relative", border: "none", padding: 0,
                    }}
                  >
                    {!scene.imageUrl && (
                      <div style={{ textAlign: "center" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p style={f({ fontWeight: 500, fontSize: "11px", color: t.textMuted })}>Click to upload image</p>
                      </div>
                    )}
                    {scene.imageUrl && (
                      <span style={{
                        position: "absolute", top: "8px", right: "8px",
                        background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "4px 8px",
                      }}>
                        <span style={f({ fontWeight: 500, fontSize: "10px", color: "#fff" })}>Replace</span>
                      </span>
                    )}
                    <div style={{
                      position: "absolute", top: "8px", left: "8px",
                      background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "4px 10px",
                    }}>
                      <p style={f({ fontWeight: 600, fontSize: "10px", color: "#fff" })}>{idx + 1}</p>
                    </div>
                  </button>
                  <div style={{ padding: "16px" }}>
                    <input
                      value={scene.scene}
                      onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, scene: e.target.value } : s))}
                      style={f({
                        fontWeight: 700, fontSize: "14px", color: t.text,
                        background: "transparent", border: "none", outline: "none",
                        width: "100%", marginBottom: "8px",
                      })}
                    />
                    <textarea
                      value={scene.description}
                      onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, description: e.target.value } : s))}
                      placeholder="Describe this scene..."
                      rows={3}
                      style={f({
                        fontWeight: 400, fontSize: "12px", color: t.textSecondary,
                        background: "transparent", border: "none", outline: "none",
                        width: "100%", lineHeight: 1.6, resize: "none",
                        boxSizing: "border-box" as const,
                      })}
                    />
                    <input
                      value={scene.mood}
                      onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, mood: e.target.value } : s))}
                      placeholder="Mood / visual reference..."
                      style={f({
                        fontWeight: 400, fontSize: "11px", color: t.textMuted,
                        background: t.hoverBg, border: "none", outline: "none",
                        width: "100%", padding: "6px 10px", borderRadius: "4px",
                        marginTop: "8px", boxSizing: "border-box" as const,
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "shotlist" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Shot List</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>
                  {capturedCount} of {shots.length} captured · Click any row to edit
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShots(prev => [...prev, { id: Date.now(), scene: "", shot: `${prev.length + 1}`, type: "B-Roll", lens: "", movement: "", description: "", captured: false }])}
                  style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Shot
                </button>
              </div>
            </div>

            <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{ height: "100%", width: `${(capturedCount / shots.length) * 100}%`, background: t.accent, borderRadius: "3px", transition: "width 0.3s" }} />
            </div>

            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "40px 70px 60px 80px 70px 90px 1fr",
                gap: "0", padding: "12px 16px", borderBottom: `1px solid ${t.border}`,
              }}>
                {["", "Scene", "Shot", "Type", "Lens", "Movement", "Description"].map((h) => (
                  <p key={h} style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>{h}</p>
                ))}
              </div>
              {shots.map((shot) => (
                <div key={shot.id}
                  onClick={() => setEditingShot(editingShot === shot.id ? null : shot.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "40px 70px 60px 80px 70px 90px 1fr",
                    gap: "0", padding: "10px 16px", borderBottom: `1px solid ${t.borderSubtle}`,
                    cursor: "pointer", background: editingShot === shot.id ? t.hoverBg : "transparent",
                    alignItems: "center",
                  }}
                >
                  <button type="button" aria-label={`Mark shot ${shot.shot} as ${shot.captured ? "not captured" : "captured"}`} onClick={(e) => { e.stopPropagation(); setShots(prev => prev.map(s => s.id === shot.id ? { ...s, captured: !s.captured } : s)); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "4px",
                      border: shot.captured ? "none" : `1.5px solid ${t.textMuted}`,
                      background: shot.captured ? t.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {shot.captured && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                  </button>
                  {editingShot === shot.id ? (
                    <>
                      <input value={shot.scene} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, scene: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 4px", outline: "none", width: "60px" })} />
                      <input value={shot.shot} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, shot: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 4px", outline: "none", width: "50px" })} />
                      <select value={shot.type} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, type: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "11px", color: t.text, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 2px", outline: "none" })}>
                        {["Hero", "B-Roll", "Macro", "Interview", "Aerial", "Slo-Mo"].map(tp => <option key={tp} value={tp}>{tp}</option>)}
                      </select>
                      <input value={shot.lens} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, lens: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 4px", outline: "none", width: "60px" })} />
                      <input value={shot.movement} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, movement: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 4px", outline: "none", width: "80px" })} />
                      <input value={shot.description} onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? { ...s, description: e.target.value } : s))} onClick={(e) => e.stopPropagation()} style={f({ fontWeight: 400, fontSize: "12px", color: t.text, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "3px", padding: "2px 4px", outline: "none", width: "100%" })} />
                    </>
                  ) : (
                    <>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textTertiary })}>{shot.scene}</p>
                      <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>{shot.shot}</p>
                      <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "2px 6px", borderRadius: "3px", display: "inline-block" })}>{shot.type}</span>
                      <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{shot.lens}</p>
                      <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{shot.movement}</p>
                      <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textSecondary, opacity: shot.captured ? 0.5 : 1, textDecoration: shot.captured ? "line-through" : "none" })}>{shot.description}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "files" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Project Files</h2>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Upload raw footage, exports, and deliverables. Drag files or click to upload.</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} />
            <button type="button" aria-label="Upload files" onClick={() => fileInputRef.current?.click()} style={{
              border: `2px dashed ${t.border}`, borderRadius: "12px", padding: "60px 40px",
              textAlign: "center", cursor: "pointer", marginBottom: "24px",
              background: t.bgCard, width: "100%",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>Drop files here</p>
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>or click to browse · MP4, MOV, RAW, JPG, PNG</p>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {[
                { name: "Raw Footage", type: "folder", items: 47, size: "12.3 GB" },
                { name: "Exports", type: "folder", items: 3, size: "1.8 GB" },
                { name: "Sound Design", type: "folder", items: 12, size: "340 MB" },
                { name: "Color Grades", type: "folder", items: 6, size: "890 MB" },
                { name: "Client Deliverables", type: "folder", items: 2, size: "2.1 GB" },
                { name: "BTS Photos", type: "folder", items: 24, size: "180 MB" },
              ].map((folder) => (
                <div key={folder.name} style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "20px", cursor: "pointer",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                  <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text, marginBottom: "4px" })}>{folder.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{folder.items} items · {folder.size}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={f({ fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "4px" })}>Client Review</h2>
              <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Track client feedback on deliverables. Send new cuts for review.</p>
            </div>

            {project.reviewQueue.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No reviews yet</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "16px" })}>Export a cut from the timeline and send it for client review.</p>
                <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer" })}>
                  Send for Review
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {project.reviewQueue.map((item, i) => {
                  const isPending = item.status === "pending";
                  const isChanges = item.status === "changes_requested";
                  return (
                    <div key={i} style={{
                      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                      padding: "24px", borderLeft: isPending ? "3px solid rgba(255,200,60,0.8)" : isChanges ? `3px solid ${t.textMuted}` : `3px solid ${t.border}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text, marginBottom: "4px" })}>{item.title}</p>
                          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Sent {item.sentAt}</p>
                        </div>
                        <span style={f({
                          fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em",
                          color: isPending ? "rgba(255,200,60,0.9)" : t.textMuted,
                          background: isPending ? "rgba(255,200,60,0.08)" : t.hoverBg,
                          padding: "6px 14px", borderRadius: "6px",
                        })}>{isPending ? "Awaiting Review" : isChanges ? "Changes Requested" : "Approved"}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isPending && <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>Nudge Client</button>}
                        {isChanges && <button style={f({ fontWeight: 600, fontSize: "11px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>View Comments</button>}
                        <button style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: "transparent", border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 16px", cursor: "pointer" })}>Open in Player</button>
                      </div>
                    </div>
                  );
                })}
                <button style={f({
                  fontWeight: 600, fontSize: "12px", color: t.textTertiary, background: "transparent",
                  border: `1px dashed ${t.border}`, borderRadius: "12px", padding: "20px", cursor: "pointer",
                  marginTop: "4px",
                })}>
                  + Send New Cut for Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
