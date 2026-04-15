import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import ClientLayout from "../components/ClientLayout";
import { useTheme } from "../components/ThemeContext";

interface Task {
  name: string;
  start: number;
  width: number;
  status: "complete" | "active" | "upcoming";
  assignee?: string;
  dependency?: string;
}

interface Phase {
  name: string;
  tasks: Task[];
}

const projects = [
  {
    id: 1,
    name: "Spring Campaign Film",
    client: "Net Your Problem",
    startDate: "Mar 1",
    endDate: "May 15",
    totalWeeks: 11,
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Marcus Cole", role: "Cinematographer", initials: "MC" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
      { name: "Kandice M.", role: "Project Manager", initials: "KM" },
    ],
    currentPosition: 62,
    phases: [
      {
        name: "Pre-Production",
        tasks: [
          { name: "Creative Brief & Treatment", start: 0, width: 8, status: "complete", assignee: "BD" },
          { name: "Storyboard & Shot List", start: 5, width: 7, status: "complete", assignee: "BD" },
          { name: "Location Scouting", start: 6, width: 6, status: "complete", assignee: "MC" },
          { name: "Talent / Crew Scheduling", start: 8, width: 6, status: "complete", assignee: "KM" },
          { name: "Equipment & Permits", start: 10, width: 6, status: "complete", assignee: "KM" },
          { name: "Client Kickoff Call", start: 2, width: 3, status: "complete", assignee: "BD" },
        ],
      },
      {
        name: "Production",
        tasks: [
          { name: "Day 1 — Dock & Harbor", start: 18, width: 4, status: "complete", assignee: "MC" },
          { name: "Day 2 — On the Water", start: 22, width: 4, status: "complete", assignee: "MC" },
          { name: "Day 3 — Processing Facility", start: 26, width: 4, status: "complete", assignee: "MC" },
          { name: "Day 4 — Interview + B-Roll", start: 30, width: 4, status: "complete", assignee: "BD" },
          { name: "Drone / Aerial Footage", start: 20, width: 10, status: "complete", assignee: "MC" },
          { name: "Audio Recording / VO", start: 32, width: 5, status: "complete", assignee: "BD" },
        ],
      },
      {
        name: "Post-Production",
        tasks: [
          { name: "Ingest & Organize Footage", start: 38, width: 4, status: "complete", assignee: "JL" },
          { name: "Rough Cut Assembly", start: 42, width: 6, status: "complete", assignee: "JL" },
          { name: "Sound Design & Mix", start: 46, width: 8, status: "active", assignee: "JL" },
          { name: "Color Grading", start: 50, width: 8, status: "active", assignee: "AT" },
          { name: "Motion Graphics & Titles", start: 52, width: 6, status: "active", assignee: "JL" },
          { name: "Music Composition", start: 44, width: 10, status: "active", assignee: "BD" },
          { name: "Fine Cut v1", start: 56, width: 5, status: "upcoming", assignee: "JL" },
          { name: "Fine Cut v2 + Revisions", start: 61, width: 5, status: "upcoming", assignee: "JL" },
        ],
      },
      {
        name: "Client Review",
        tasks: [
          { name: "Internal QC Review", start: 66, width: 3, status: "upcoming", assignee: "BD" },
          { name: "Client Review — v1", start: 69, width: 5, status: "upcoming", assignee: "KM" },
          { name: "Revision Round", start: 74, width: 4, status: "upcoming", assignee: "JL" },
          { name: "Client Review — Final", start: 78, width: 4, status: "upcoming", assignee: "KM" },
          { name: "Sign-Off & Approval", start: 82, width: 3, status: "upcoming", assignee: "KM" },
        ],
      },
      {
        name: "Final Delivery",
        tasks: [
          { name: "Master Export (16:9)", start: 86, width: 3, status: "upcoming", assignee: "JL" },
          { name: "Social Cuts (9:16, 1:1)", start: 86, width: 4, status: "upcoming", assignee: "JL" },
          { name: "Asset Upload & Archival", start: 90, width: 4, status: "upcoming", assignee: "KM" },
          { name: "Client Handoff", start: 94, width: 3, status: "upcoming", assignee: "KM" },
        ],
      },
    ] as Phase[],
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
    totalWeeks: 9,
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Sam Reeves", role: "Cinematographer", initials: "SR" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
    ],
    currentPosition: 30,
    phases: [
      {
        name: "Pre-Production",
        tasks: [
          { name: "Creative Brief", start: 0, width: 6, status: "complete", assignee: "BD" },
          { name: "Storyboard", start: 3, width: 5, status: "complete", assignee: "BD" },
          { name: "Shot List & Moodboard", start: 5, width: 5, status: "complete", assignee: "SR" },
          { name: "Product Styling Plan", start: 8, width: 5, status: "complete", assignee: "BD" },
          { name: "Logistics & Crew", start: 10, width: 4, status: "complete", assignee: "BD" },
        ],
      },
      {
        name: "Production",
        tasks: [
          { name: "Studio Setup & Lighting", start: 16, width: 3, status: "complete", assignee: "SR" },
          { name: "Product Macro Shots", start: 19, width: 5, status: "active", assignee: "SR" },
          { name: "Warehouse / Processing Shots", start: 22, width: 6, status: "active", assignee: "SR" },
          { name: "Drone — Fleet at Golden Hour", start: 26, width: 4, status: "upcoming", assignee: "SR" },
          { name: "Slow-Mo Water Elements", start: 28, width: 4, status: "upcoming", assignee: "SR" },
        ],
      },
      {
        name: "Post-Production",
        tasks: [
          { name: "Ingest & Selects", start: 34, width: 3, status: "upcoming", assignee: "JL" },
          { name: "Assembly Cut", start: 37, width: 5, status: "upcoming", assignee: "JL" },
          { name: "Sound Design", start: 40, width: 6, status: "upcoming", assignee: "JL" },
          { name: "Color Grade", start: 42, width: 5, status: "upcoming", assignee: "JL" },
          { name: "Logo Sting & Tagline", start: 44, width: 4, status: "upcoming", assignee: "JL" },
          { name: "60-sec Master Cut", start: 48, width: 4, status: "upcoming", assignee: "JL" },
        ],
      },
      {
        name: "Client Review",
        tasks: [
          { name: "Internal QC", start: 54, width: 3, status: "upcoming", assignee: "BD" },
          { name: "Client Review", start: 57, width: 5, status: "upcoming", assignee: "BD" },
          { name: "Revisions", start: 62, width: 4, status: "upcoming", assignee: "JL" },
          { name: "Final Approval", start: 66, width: 3, status: "upcoming", assignee: "BD" },
        ],
      },
      {
        name: "Final Delivery",
        tasks: [
          { name: "Export All Formats", start: 70, width: 3, status: "upcoming", assignee: "JL" },
          { name: "Trade Show Package", start: 70, width: 4, status: "upcoming", assignee: "JL" },
          { name: "Client Handoff", start: 74, width: 3, status: "upcoming", assignee: "BD" },
        ],
      },
    ] as Phase[],
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

export default function ClientProjects() {
  const { t } = useTheme();
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    Object.fromEntries(projects[0].phases.map((p) => [p.name, true]))
  );

  const togglePhase = (name: string) => {
    setExpandedPhases((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const taskBarColor = (status: string) => {
    if (status === "complete") return t.text;
    if (status === "active") return t.text;
    return t.border;
  };

  const taskBarOpacity = (status: string) => {
    if (status === "complete") return 0.6;
    if (status === "active") return 1;
    return 1;
  };

  const totalTasks = selectedProject.phases.reduce((s, p) => s + p.tasks.length, 0);
  const completeTasks = selectedProject.phases.reduce((s, p) => s + p.tasks.filter((tk) => tk.status === "complete").length, 0);
  const activeTasks = selectedProject.phases.reduce((s, p) => s + p.tasks.filter((tk) => tk.status === "active").length, 0);
  const overallProgress = Math.round(((completeTasks + activeTasks * 0.5) / totalTasks) * 100);

  const weekLabels: string[] = [];
  const totalWeeks = selectedProject.totalWeeks;
  for (let i = 1; i <= totalWeeks; i++) weekLabels.push(`W${i}`);

  const docLink = (href: string, label: string, icon: ReactNode, subtitle: string) => (
    <Link href={href} style={{ textDecoration: "none", display: "block", marginBottom: "8px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: t.textTertiary, display: "flex" }}>{icon}</span>
          <div>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, display: "block" }}>{label}</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{subtitle}</span>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );

  return (
    <ClientLayout>
      <div style={{ padding: "40px 48px" }}>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "32px" }}>Projects</h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProject(p);
                setExpandedSections({});
                setExpandedPhases(Object.fromEntries(p.phases.map((ph) => [ph.name, true])));
              }}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: selectedProject.id === p.id ? 600 : 400,
                fontSize: "13px",
                color: selectedProject.id === p.id ? t.text : t.textTertiary,
                background: selectedProject.id === p.id ? t.activeNav : "transparent",
                border: `1px solid ${selectedProject.id === p.id ? t.border : t.borderSubtle}`,
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
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary }}>Schedule</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "12px", color: t.textMuted }}>{selectedProject.startDate} — {selectedProject.endDate}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "12px", color: t.textTertiary }}>{overallProgress}% complete</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Total Tasks", value: totalTasks },
              { label: "Complete", value: completeTasks },
              { label: "In Progress", value: activeTasks },
              { label: "Upcoming", value: totalTasks - completeTasks - activeTasks },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "12px 16px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", flex: 1, textAlign: "center" }}>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "18px", color: t.text, marginBottom: "2px" }}>{stat.value}</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: "220px", flexShrink: 0, padding: "10px 16px", display: "flex", alignItems: "center" }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Task</span>
              </div>
              <div style={{ width: "50px", flexShrink: 0, padding: "10px 4px", textAlign: "center" }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Who</span>
              </div>
              <div style={{ flex: 1, display: "flex", position: "relative" }}>
                {weekLabels.map((w, i) => (
                  <div key={w} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderLeft: i > 0 ? `1px solid ${t.borderSubtle}` : "none" }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedProject.phases.map((phase) => {
              const phaseComplete = phase.tasks.every((tk) => tk.status === "complete");
              const phaseActive = phase.tasks.some((tk) => tk.status === "active");
              const isExpanded = expandedPhases[phase.name] !== false;

              return (
                <div key={phase.name}>
                  <div
                    onClick={() => togglePhase(phase.name)}
                    style={{
                      display: "flex",
                      borderBottom: `1px solid ${t.border}`,
                      cursor: "pointer",
                      background: t.hoverBg,
                    }}
                  >
                    <div style={{ width: "220px", flexShrink: 0, padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "12px", color: t.text }}>{phase.name}</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "10px", color: t.textMuted }}>({phase.tasks.length})</span>
                    </div>
                    <div style={{ width: "50px", flexShrink: 0, padding: "10px 4px", textAlign: "center" }}>
                      <span style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: phaseComplete ? t.textTertiary : phaseActive ? t.text : t.textMuted,
                        background: phaseComplete ? t.activeNav : phaseActive ? t.activeNav : "transparent",
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}>
                        {phaseComplete ? "Done" : phaseActive ? "Now" : "—"}
                      </span>
                    </div>
                    <div style={{ flex: 1, display: "flex", position: "relative" }}>
                      {weekLabels.map((_, i) => (
                        <div key={i} style={{ flex: 1, borderLeft: i > 0 ? `1px solid ${t.borderSubtle}` : "none" }} />
                      ))}
                      {!isExpanded && (
                        <>
                          {phase.tasks.map((task, ti) => {
                            const barLeft = (task.start / 100) * 100;
                            const barWidth = (task.width / 100) * 100;
                            return (
                              <div
                                key={ti}
                                style={{
                                  position: "absolute",
                                  left: `${barLeft}%`,
                                  width: `${barWidth}%`,
                                  height: "4px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: taskBarColor(task.status),
                                  opacity: taskBarOpacity(task.status),
                                  borderRadius: "2px",
                                }}
                              />
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && phase.tasks.map((task, ti) => (
                    <div
                      key={ti}
                      style={{
                        display: "flex",
                        borderBottom: `1px solid ${t.borderSubtle}`,
                      }}
                    >
                      <div style={{ width: "220px", flexShrink: 0, padding: "8px 16px 8px 36px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: task.status === "complete" ? "none" : `1.5px solid ${task.status === "active" ? t.text : t.textMuted}`,
                          background: task.status === "complete" ? t.text : "transparent",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {task.status === "complete" && (
                            <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                        <span style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: task.status === "active" ? 600 : 400,
                          fontSize: "11px",
                          color: task.status === "upcoming" ? t.textMuted : task.status === "active" ? t.text : t.textSecondary,
                          textDecoration: task.status === "complete" ? "none" : "none",
                        }}>
                          {task.name}
                        </span>
                      </div>
                      <div style={{ width: "50px", flexShrink: 0, padding: "8px 4px", textAlign: "center" }}>
                        <span style={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 600,
                          fontSize: "9px",
                          color: t.textMuted,
                          background: t.hoverBg,
                          padding: "2px 5px",
                          borderRadius: "3px",
                        }}>
                          {task.assignee}
                        </span>
                      </div>
                      <div style={{ flex: 1, position: "relative", display: "flex" }}>
                        {weekLabels.map((_, i) => (
                          <div key={i} style={{ flex: 1, borderLeft: i > 0 ? `1px solid ${t.borderSubtle}` : "none" }} />
                        ))}
                        <div
                          style={{
                            position: "absolute",
                            left: `${(task.start / 100) * 100}%`,
                            width: `${(task.width / 100) * 100}%`,
                            height: "6px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: taskBarColor(task.status),
                            opacity: taskBarOpacity(task.status),
                            borderRadius: "3px",
                          }}
                        >
                          {task.status === "active" && (
                            <div style={{
                              position: "absolute",
                              right: "-3px",
                              top: "-3px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: t.text,
                              border: `2px solid ${t.bgCard}`,
                            }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            <div style={{ display: "flex", borderTop: `1px solid ${t.border}` }}>
              <div style={{ width: "270px", flexShrink: 0 }} />
              <div style={{ flex: 1, position: "relative", height: "28px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: `${selectedProject.currentPosition}%`,
                    top: "0",
                    bottom: "0",
                    width: "1px",
                    background: t.text,
                    opacity: 0.3,
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${selectedProject.currentPosition}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    color: t.accentText,
                    background: t.text,
                    padding: "2px 8px",
                    borderRadius: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    zIndex: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  Today
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", padding: "12px 16px", borderTop: `1px solid ${t.border}` }}>
              {[
                { icon: <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.text }} />, label: "Complete" },
                { icon: <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: `1.5px solid ${t.text}` }} />, label: "In Progress" },
                { icon: <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: `1.5px solid ${t.textMuted}` }} />, label: "Upcoming" },
              ].map((legend) => (
                <div key={legend.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {legend.icon}
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "10px", color: t.textMuted }}>{legend.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "40px" }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Project Documents</h2>

            {docLink(`/client-hub/projects/${selectedProject.id}/treatment`, "Treatment / Creative Brief", (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>), "Written narrative & creative direction")}
            {docLink(`/client-hub/projects/${selectedProject.id}/storyboard`, "Storyboard", (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>), `${selectedProject.sections.storyboard.length} scenes · Visual mood board`)}
            {docLink(`/client-hub/projects/${selectedProject.id}/shotlist`, "Shot List", (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>), `${selectedProject.sections.shotlist.length}+ planned shots`)}
            {docLink(`/client-hub/projects/${selectedProject.id}/notes`, "Client Notes & Context", (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>), "Preferences, feedback & project context")}
          </div>

          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: t.textTertiary, marginBottom: "16px" }}>Your Team</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedProject.team.map((member) => (
                <div key={member.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: t.bgCard, border: `1px solid ${t.borderSubtle}`, borderRadius: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: t.activeNav, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "11px", color: t.textTertiary, flexShrink: 0 }}>{member.initials}</div>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "13px", color: t.text, lineHeight: 1.3 }}>{member.name}</p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: "11px", color: t.textMuted }}>{member.role}</p>
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
