import { useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

interface CrewMember {
  id: number;
  name: string;
  role: string;
  initials: string;
  email: string;
  phone: string;
  rate: string;
  rateType: "day" | "project";
  status: "available" | "on-project" | "unavailable";
  currentProject?: string;
  skills: string[];
  projectCount: number;
  joinedDate: string;
}

const crew: CrewMember[] = [
  {
    id: 1, name: "Bri Dwyer", role: "Director / Producer", initials: "BD",
    email: "bri@pgtsnd.com", phone: "(503) 555-0100",
    rate: "—", rateType: "day", status: "on-project", currentProject: "Spring Campaign Film",
    skills: ["Directing", "Producing", "Strategy", "Client Relations"],
    projectCount: 8, joinedDate: "Founder",
  },
  {
    id: 2, name: "Marcus Cole", role: "Cinematographer", initials: "MC",
    email: "marcus@pgtsnd.com", phone: "(503) 555-0112",
    rate: "$1,200", rateType: "day", status: "on-project", currentProject: "Product Launch Teaser",
    skills: ["Cinematography", "Lighting", "Drone", "Steadicam"],
    projectCount: 6, joinedDate: "Mar 2023",
  },
  {
    id: 3, name: "Jamie Lin", role: "Editor", initials: "JL",
    email: "jamie@pgtsnd.com", phone: "(503) 555-0134",
    rate: "$800", rateType: "day", status: "on-project", currentProject: "Spring Campaign Film",
    skills: ["Premiere Pro", "DaVinci Resolve", "Sound Design", "Motion Graphics"],
    projectCount: 7, joinedDate: "Jun 2023",
  },
  {
    id: 4, name: "Alex Torres", role: "Colorist", initials: "AT",
    email: "alex@pgtsnd.com", phone: "(971) 555-0156",
    rate: "$900", rateType: "day", status: "on-project", currentProject: "Spring Campaign Film",
    skills: ["DaVinci Resolve", "Color Science", "HDR", "LUT Creation"],
    projectCount: 5, joinedDate: "Sep 2023",
  },
  {
    id: 5, name: "Sam Reeves", role: "Cinematographer", initials: "SR",
    email: "sam@pgtsnd.com", phone: "(503) 555-0178",
    rate: "$1,100", rateType: "day", status: "available",
    skills: ["Cinematography", "Macro", "Product Photography", "Lighting"],
    projectCount: 4, joinedDate: "Jan 2024",
  },
  {
    id: 6, name: "Kandice M.", role: "Project Manager", initials: "KM",
    email: "kandice@pgtsnd.com", phone: "(503) 555-0190",
    rate: "$5,000", rateType: "project", status: "on-project", currentProject: "Product Launch Teaser",
    skills: ["Scheduling", "Budgets", "Contracts", "Client Communication"],
    projectCount: 6, joinedDate: "Apr 2023",
  },
];

export default function TeamCrew() {
  const { t } = useTheme();
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const available = crew.filter((c) => c.status === "available").length;
  const onProject = crew.filter((c) => c.status === "on-project").length;

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Crew</h1>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{crew.length} members · {available} available · {onProject} on project</p>
          </div>
          <button style={f({ fontWeight: 600, fontSize: "12px", color: t.accentText, background: t.accent, border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Member
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {crew.map((member) => (
            <div key={member.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={expandedMember === member.id}
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "20px 24px", cursor: "pointer", width: "100%",
                  background: "transparent", border: "none", textAlign: "left",
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", background: t.activeNav,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...f({ fontWeight: 700, fontSize: "14px", color: t.textTertiary }),
                  flexShrink: 0,
                }}>{member.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "2px" })}>{member.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{member.role}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {member.currentProject && (
                    <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{member.currentProject}</span>
                  )}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "4px",
                    background: member.status === "available" ? "rgba(255,255,255,0.06)" : t.hoverBg,
                  }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: member.status === "available" ? t.accent : member.status === "on-project" ? t.textMuted : "rgba(255,200,60,0.6)",
                    }} />
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, textTransform: "capitalize" })}>
                      {member.status === "on-project" ? "Busy" : member.status}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: expandedMember === member.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </button>

              {expandedMember === member.id && (
                <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${t.borderSubtle}`, paddingTop: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Email</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.email}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Phone</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.phone}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Rate</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.rate}{member.rate !== "—" ? `/${member.rateType}` : ""}</p>
                    </div>
                    <div>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Projects Completed</p>
                      <p style={f({ fontWeight: 500, fontSize: "12px", color: t.textSecondary })}>{member.projectCount}</p>
                    </div>
                  </div>
                  <div>
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>Skills</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {member.skills.map((skill) => (
                        <span key={skill} style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary, background: t.hoverBg, padding: "4px 10px", borderRadius: "4px" })}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, marginTop: "16px" })}>Member since {member.joinedDate}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </TeamLayout>
  );
}
