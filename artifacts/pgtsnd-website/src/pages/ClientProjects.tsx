import { useState } from "react";
import ClientLayout from "../components/ClientLayout";

const projects = [
  {
    id: 1,
    name: "Spring Campaign Film",
    client: "Net Your Problem",
    status: "In Review",
    currentPhase: 3,
    dueDate: "May 15, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Marcus Cole", role: "Cinematographer", initials: "MC" },
      { name: "Jamie Lin", role: "Editor", initials: "JL" },
      { name: "Alex Torres", role: "Colorist", initials: "AT" },
    ],
    phases: [
      { name: "Pre-Production", status: "complete", dates: "Mar 1 – Mar 15" },
      { name: "Production", status: "complete", dates: "Mar 18 – Apr 2" },
      { name: "Post-Production", status: "active", dates: "Apr 5 – May 1" },
      { name: "Review", status: "upcoming", dates: "May 2 – May 10" },
      { name: "Delivery", status: "upcoming", dates: "May 15" },
    ],
  },
  {
    id: 2,
    name: "Product Launch Teaser",
    client: "Net Your Problem",
    status: "Filming",
    currentPhase: 1,
    dueDate: "June 2, 2025",
    team: [
      { name: "Bri Dwyer", role: "Director / Producer", initials: "BD" },
      { name: "Sam Reeves", role: "Cinematographer", initials: "SR" },
    ],
    phases: [
      { name: "Pre-Production", status: "complete", dates: "Apr 1 – Apr 10" },
      { name: "Production", status: "active", dates: "Apr 14 – Apr 28" },
      { name: "Post-Production", status: "upcoming", dates: "May 1 – May 20" },
      { name: "Review", status: "upcoming", dates: "May 21 – May 28" },
      { name: "Delivery", status: "upcoming", dates: "June 2" },
    ],
  },
];

export default function ClientProjects() {
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  return (
    <ClientLayout>
      <div style={{ padding: "48px 56px" }}>
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: "28px",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            marginBottom: "40px",
          }}
        >
          Projects
        </h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "48px" }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: selectedProject.id === p.id ? 600 : 400,
                fontSize: "13px",
                color: selectedProject.id === p.id ? "#ffffff" : "rgba(255,255,255,0.5)",
                background: selectedProject.id === p.id ? "rgba(255,255,255,0.08)" : "transparent",
                border: "1px solid",
                borderColor: selectedProject.id === p.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "10px 20px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "48px" }}>
          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "32px",
              }}
            >
              Project Timeline
            </h2>

            <div style={{ position: "relative", paddingLeft: "28px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "6px",
                  top: "8px",
                  bottom: "8px",
                  width: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              />

              {selectedProject.phases.map((phase, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    marginBottom: i < selectedProject.phases.length - 1 ? "36px" : "0",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-28px",
                      top: "4px",
                      width: "13px",
                      height: "13px",
                      borderRadius: "50%",
                      background:
                        phase.status === "complete"
                          ? "#ffffff"
                          : phase.status === "active"
                          ? "#000000"
                          : "#000000",
                      border:
                        phase.status === "complete"
                          ? "none"
                          : phase.status === "active"
                          ? "2px solid #ffffff"
                          : "2px solid rgba(255,255,255,0.2)",
                      boxShadow: phase.status === "active" ? "0 0 0 4px rgba(255,255,255,0.1)" : "none",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: phase.status === "active" ? 700 : 500,
                        fontSize: "15px",
                        color: phase.status === "upcoming" ? "rgba(255,255,255,0.3)" : "#ffffff",
                        marginBottom: "4px",
                      }}
                    >
                      {phase.name}
                      {phase.status === "active" && (
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#60d060",
                            background: "rgba(96,208,96,0.1)",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            marginLeft: "12px",
                          }}
                        >
                          In Progress
                        </span>
                      )}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 400,
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {phase.dates}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: "32px",
              }}
            >
              Your Team
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {selectedProject.team.map((member) => (
                <div
                  key={member.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.6)",
                      flexShrink: 0,
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "#ffffff",
                        lineHeight: 1.3,
                      }}
                    >
                      {member.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 400,
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "32px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                Due Date
              </p>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "#ffffff",
                }}
              >
                {selectedProject.dueDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
