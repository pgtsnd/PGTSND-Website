import { useState } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";

const weeks = ["Apr 7", "Apr 14", "Apr 21", "Apr 28", "May 5", "May 12", "May 19", "May 26", "Jun 2", "Jun 9"];
const todayWeekIndex = 1;

interface ScheduleItem {
  project: string;
  projectId: number;
  phase: string;
  startWeek: number;
  endWeek: number;
  intensity: "high" | "medium" | "low";
  milestones: { week: number; label: string }[];
}

const scheduleItems: ScheduleItem[] = [
  {
    project: "Spring Campaign Film", projectId: 1, phase: "Post-Production",
    startWeek: 0, endWeek: 5, intensity: "high",
    milestones: [
      { week: 1, label: "Rough Cut v2" },
      { week: 3, label: "Fine Cut" },
      { week: 5, label: "Final Delivery" },
    ],
  },
  {
    project: "Product Launch Teaser", projectId: 2, phase: "Production",
    startWeek: 1, endWeek: 8, intensity: "medium",
    milestones: [
      { week: 2, label: "Shoot Day 1" },
      { week: 3, label: "Shoot Day 2" },
      { week: 6, label: "Rough Cut" },
      { week: 8, label: "Final Delivery" },
    ],
  },
  {
    project: "Brand Story — Founders Cut", projectId: 3, phase: "Paused",
    startWeek: 0, endWeek: 2, intensity: "low",
    milestones: [],
  },
];

const upcomingEvents = [
  { date: "Apr 15", day: "Tue", title: "Product macro shoot", project: "Product Launch Teaser", crew: ["Sam Reeves", "Bri Dwyer"], time: "9:00 AM – 4:00 PM" },
  { date: "Apr 16", day: "Wed", title: "Sound design review", project: "Spring Campaign Film", crew: ["Jamie Lin", "Bri Dwyer"], time: "2:00 PM" },
  { date: "Apr 18", day: "Fri", title: "Color grading review — Scenes 1-3", project: "Spring Campaign Film", crew: ["Alex Torres", "Bri Dwyer"], time: "10:00 AM" },
  { date: "Apr 22", day: "Tue", title: "Shoot Day 2 — Street + cafe scenes", project: "Product Launch Teaser", crew: ["Sam Reeves", "Bri Dwyer"], time: "7:00 AM – 6:00 PM" },
  { date: "Apr 25", day: "Fri", title: "Fine Cut delivery target", project: "Spring Campaign Film", crew: ["Jamie Lin"], time: "EOD" },
];

export default function TeamSchedule() {
  const { t } = useTheme();
  const [view, setView] = useState<"timeline" | "upcoming">("timeline");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>Schedule</h1>
          <div style={{ display: "flex", gap: "4px", background: t.hoverBg, borderRadius: "6px", padding: "3px" }}>
            {(["timeline", "upcoming"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={f({
                fontWeight: view === v ? 600 : 400, fontSize: "12px",
                color: view === v ? t.text : t.textMuted,
                background: view === v ? t.bgCard : "transparent",
                border: view === v ? `1px solid ${t.border}` : "1px solid transparent",
                borderRadius: "4px", padding: "6px 14px", cursor: "pointer",
                textTransform: "capitalize",
              })}>{v}</button>
            ))}
          </div>
        </div>

        {view === "timeline" && (
          <div>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)`, borderBottom: `1px solid ${t.border}` }}>
                <div style={{ padding: "14px 20px" }}>
                  <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" })}>Project</p>
                </div>
                {weeks.map((week, i) => (
                  <div key={week} style={{
                    padding: "14px 8px", textAlign: "center",
                    borderLeft: `1px solid ${t.borderSubtle}`,
                    background: i === todayWeekIndex ? "rgba(255,255,255,0.03)" : "transparent",
                  }}>
                    <p style={f({ fontWeight: i === todayWeekIndex ? 700 : 400, fontSize: "10px", color: i === todayWeekIndex ? t.text : t.textMuted })}>{week}</p>
                    {i === todayWeekIndex && <p style={f({ fontWeight: 600, fontSize: "8px", color: t.accent, textTransform: "uppercase", marginTop: "2px" })}>Today</p>}
                  </div>
                ))}
              </div>

              {scheduleItems.map((item, rowIndex) => (
                <div key={item.project} style={{
                  display: "grid", gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)`,
                  borderBottom: rowIndex < scheduleItems.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                  minHeight: "64px", alignItems: "center",
                }}>
                  <div style={{ padding: "12px 20px" }}>
                    <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text, marginBottom: "2px" })}>{item.project}</p>
                    <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>{item.phase}</p>
                  </div>
                  {weeks.map((_, colIndex) => (
                    <div key={colIndex} style={{
                      borderLeft: `1px solid ${t.borderSubtle}`,
                      height: "100%", padding: "4px 2px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative",
                      background: colIndex === todayWeekIndex ? t.hoverBg : "transparent",
                    }}>
                      {colIndex >= item.startWeek && colIndex <= item.endWeek && (
                        <div style={{
                          position: "absolute", left: colIndex === item.startWeek ? "4px" : "0",
                          right: colIndex === item.endWeek ? "4px" : "0",
                          height: "8px", background: item.intensity === "high" ? t.text : item.intensity === "medium" ? t.textTertiary : t.textMuted, borderRadius: colIndex === item.startWeek && colIndex === item.endWeek ? "4px" : colIndex === item.startWeek ? "4px 0 0 4px" : colIndex === item.endWeek ? "0 4px 4px 0" : "0",
                          opacity: item.phase === "Paused" ? 0.3 : 0.6,
                        }} />
                      )}
                      {item.milestones.some((m) => m.week === colIndex) && (
                        <div title={item.milestones.find((m) => m.week === colIndex)?.label} style={{
                          position: "absolute", top: "50%", transform: "translateY(-50%)",
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: t.accent, border: `2px solid ${t.bgCard}`,
                          zIndex: 2,
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "12px", display: "flex", gap: "20px", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "20px", height: "4px", background: t.text, borderRadius: "2px", opacity: 0.6 }} />
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Active</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.accent }} />
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Milestone</span>
              </div>
            </div>
          </div>
        )}

        {view === "upcoming" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {upcomingEvents.map((event, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "20px",
                background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                padding: "20px 24px",
              }}>
                <div style={{ textAlign: "center", minWidth: "48px" }}>
                  <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text })}>{event.date.split(" ")[1]}</p>
                  <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase" })}>{event.day}</p>
                </div>
                <div style={{ width: "1px", background: t.border, alignSelf: "stretch" }} />
                <div style={{ flex: 1 }}>
                  <p style={f({ fontWeight: 700, fontSize: "14px", color: t.text, marginBottom: "4px" })}>{event.title}</p>
                  <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "8px" })}>{event.project} · {event.time}</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {event.crew.map((c) => (
                      <span key={c} style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "3px 8px", borderRadius: "4px" })}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
