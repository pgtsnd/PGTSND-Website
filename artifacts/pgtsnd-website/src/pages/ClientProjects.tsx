import { useState, type ReactNode } from "react";
import ClientLayout from "../components/ClientLayout";

const projects = [
  {
    id: 1,
    name: "Spring Campaign Film",
    client: "Net Your Problem",
    startDate: "Mar 1",
    endDate: "May 15",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Marcus Cole", role: "Cinematographer", initials: "MC" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
    ],
    phases: [
      { name: "Pre-Production", start: 0, width: 18, status: "complete" },
      { name: "Production", start: 20, width: 20, status: "complete" },
      { name: "Post-Production", start: 42, width: 28, status: "active" },
      { name: "Client Review", start: 72, width: 14, status: "upcoming" },
      { name: "Final Delivery", start: 88, width: 12, status: "upcoming" },
    ],
    currentPosition: 62,
    sections: {
      treatment: "A 3-minute brand documentary showcasing Net Your Problem's sustainable fishing practices in the Pacific Northwest. The film follows the crew through a full harvest cycle — from pre-dawn boat launch through the sorting process and final delivery. Tone: gritty, authentic, hopeful. We're leaning into the human element — calloused hands, early morning fog, the rhythm of physical work. The final cut will serve as a hero piece for their website and investor deck.",
      storyboard: [
        "Scene 1: Pre-dawn — dock, boats, fog, crew gathering",
        "Scene 2: On the water — nets deployed, aerial establishing shots",
        "Scene 3: The haul — close-ups of catch, sorting, teamwork",
        "Scene 4: Processing facility — scale, precision, care",
        "Scene 5: Final product — packaged, branded, ready for market",
        "Scene 6: Interview — Nicole speaking to camera about mission",
      ],
      shotlist: [
        "Wide establishing — harbor at sunrise (drone)",
        "Medium — crew prepping gear on deck",
        "Close-up — hands tying nets, coiling rope",
        "Aerial tracking — boat leaving harbor",
        "POV — nets hitting water",
        "Close-up — fish in nets, water spray",
        "Wide — processing floor, workers in motion",
        "Macro — brand label on final product",
        "Interview setup — Nicole, natural light, 85mm",
        "B-roll — team laughing, candid moments",
      ],
      clientNotes: "Nicole requested we avoid any shots that look 'too industrial.' She wants the brand to feel artisanal and personal. Updated logo files uploaded Apr 8. Final delivery must include 16:9 and 9:16 cuts. Music should feel organic — acoustic guitar, light percussion. No stock music; she wants something composed.",
    },
  },
  {
    id: 2,
    name: "Product Launch Teaser",
    client: "Net Your Problem",
    startDate: "Apr 1",
    endDate: "Jun 2",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Sam Reeves", role: "Cinematographer", initials: "SR" },
    ],
    phases: [
      { name: "Pre-Production", start: 0, width: 16, status: "complete" },
      { name: "Production", start: 18, width: 24, status: "active" },
      { name: "Post-Production", start: 44, width: 30, status: "upcoming" },
      { name: "Client Review", start: 76, width: 12, status: "upcoming" },
      { name: "Final Delivery", start: 90, width: 10, status: "upcoming" },
    ],
    currentPosition: 30,
    sections: {
      treatment: "60-second product launch teaser for Net Your Problem's new sustainable sablefish line. Fast-paced, energetic, designed for social media and trade show screens. Opens with a dramatic macro reveal of the product, then pulls back to show the scale of the operation. Ends with the tagline and logo sting.",
      storyboard: [
        "Scene 1: Black screen, sound of water — macro reveal of product",
        "Scene 2: Quick cuts — processing, packaging, branding",
        "Scene 3: Wide shot — fleet at sea, golden hour",
        "Scene 4: Logo sting with tagline",
      ],
      shotlist: [
        "Macro — product packaging, shallow DOF",
        "Medium — hands packaging product",
        "Wide — warehouse floor, motion blur",
        "Aerial — fleet formation at golden hour",
        "Slow motion — product splash / water element",
      ],
      clientNotes: "Nicole wants this to feel 'premium but rugged.' She referenced Apple product videos but with a fishing industry twist. Must be deliverable by June 2 for the trade show in Portland.",
    },
  },
];

const phaseColors: Record<string, string> = {
  complete: "rgba(120,200,120,0.7)",
  active: "#ffffff",
  upcoming: "rgba(255,255,255,0.15)",
};

export default function ClientProjects() {
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionButton = (key: string, label: string, icon: ReactNode) => (
    <button
      onClick={() => toggleSection(key)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: expandedSections[key] ? "8px 8px 0 0" : "8px",
        cursor: "pointer",
        marginBottom: expandedSections[key] ? "0" : "8px",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex" }}>{icon}</span>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>
          {label}
        </span>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        style={{ transform: expandedSections[key] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: "#ffffff", marginBottom: "32px" }}>
          Projects
        </h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProject(p); setExpandedSections({}); }}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: selectedProject.id === p.id ? 600 : 400,
                fontSize: "13px",
                color: selectedProject.id === p.id ? "#ffffff" : "rgba(255,255,255,0.45)",
                background: selectedProject.id === p.id ? "rgba(255,255,255,0.06)" : "transparent",
                border: "1px solid",
                borderColor: selectedProject.id === p.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>
              Schedule
            </h2>
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
                {selectedProject.startDate} — {selectedProject.endDate}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              {["Week 1-2", "Week 3-4", "Week 5-6", "Week 7-8", "Week 9-10", "Week 11-12"].map((label) => (
                <span key={label} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </span>
              ))}
            </div>

            {selectedProject.phases.map((phase, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "16px" }}>
                <span
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: phase.status === "active" ? 600 : 400,
                    fontSize: "12px",
                    color: phase.status === "upcoming" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
                    width: "140px",
                    flexShrink: 0,
                  }}
                >
                  {phase.name}
                </span>
                <div style={{ flex: 1, height: "28px", position: "relative", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: `${phase.start}%`,
                      width: `${phase.width}%`,
                      height: "100%",
                      background: phaseColors[phase.status],
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "10px",
                    }}
                  >
                    {phase.status === "active" && (
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "9px", color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        NOW
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ position: "relative", height: "20px", marginTop: "8px", marginLeft: "156px" }}>
              <div
                style={{
                  position: "absolute",
                  left: `${selectedProject.currentPosition}%`,
                  top: "0",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polygon points="5,0 10,10 0,10" fill="rgba(255,200,60,0.8)" />
                </svg>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "9px", color: "rgba(255,200,60,0.8)", marginTop: "2px", textTransform: "uppercase" }}>
                  Today
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {[
                { color: "rgba(120,200,120,0.7)", label: "Complete" },
                { color: "#ffffff", label: "In Progress" },
                { color: "rgba(255,255,255,0.15)", label: "Upcoming" },
              ].map((legend) => (
                <div key={legend.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: legend.color }} />
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                    {legend.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "40px" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              Project Documents
            </h2>

            {sectionButton("treatment", "Treatment / Creative Brief", (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ))}
            {expandedSections["treatment"] && (
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: "8px" }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                  {selectedProject.sections.treatment}
                </p>
              </div>
            )}

            {sectionButton("storyboard", "Storyboard", (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="12" y1="2" x2="12" y2="22" />
              </svg>
            ))}
            {expandedSections["storyboard"] && (
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: "8px" }}>
                {selectedProject.sections.storyboard.map((scene, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: "rgba(255,255,255,0.25)", minWidth: "20px" }}>
                      {i + 1}.
                    </span>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      {scene}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {sectionButton("shotlist", "Shot List", (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ))}
            {expandedSections["shotlist"] && (
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: "8px" }}>
                {selectedProject.sections.shotlist.map((shot, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "center" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                      {shot}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {sectionButton("clientNotes", "Client Notes & Context", (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            ))}
            {expandedSections["clientNotes"] && (
              <div style={{ padding: "20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: "8px" }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                  {selectedProject.sections.clientNotes}
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              Your Team
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedProject.team.map((member) => (
                <div key={member.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                    {member.initials}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: "#ffffff", lineHeight: 1.3 }}>
                      {member.name}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
