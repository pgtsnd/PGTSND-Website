import { useState, useMemo } from "react";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatPhase,
  formatDate,
  type Project,
} from "../hooks/useTeamData";

export default function TeamSchedule() {
  const { t } = useTheme();
  const { isLoading: authLoading } = useTeamAuth();
  const { projects, isLoading } = useDashboardData();
  const [view, setView] = useState<"timeline" | "upcoming">("timeline");
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = projects.filter((p) => p.status !== "archived");

  const weeks = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const result: string[] = [];
    for (let i = -1; i < 9; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i * 7);
      result.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return result;
  }, []);

  const todayWeekIndex = 1;

  const scheduleItems = activeProjects.map((p) => {
    const now = new Date();
    const startDate = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
    const dueDate = p.dueDate ? new Date(p.dueDate) : null;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 - 7);

    const startWeek = Math.max(0, Math.floor((startDate.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const endWeek = dueDate
      ? Math.min(weeks.length - 1, Math.floor((dueDate.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : Math.min(weeks.length - 1, startWeek + 4);

    const milestones: { week: number; label: string }[] = [];
    if (dueDate) {
      milestones.push({ week: Math.min(endWeek, weeks.length - 1), label: "Due Date" });
    }

    return {
      project: p.name,
      projectId: p.id,
      phase: formatPhase(p.phase),
      startWeek: Math.max(0, startWeek),
      endWeek: Math.max(0, endWeek),
      intensity: p.progress > 50 ? "high" as const : p.progress > 20 ? "medium" as const : "low" as const,
      milestones,
      isPaused: p.status === "lead",
    };
  });

  const upcomingEvents = activeProjects
    .filter((p) => p.dueDate)
    .map((p) => {
      const d = new Date(p.dueDate!);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        title: `${formatPhase(p.phase)} — ${p.name}`,
        project: p.name,
        time: "Due date",
        sortDate: d.getTime(),
      };
    })
    .sort((a, b) => a.sortDate - b.sortDate);

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading schedule...</p>
        </div>
      </TeamLayout>
    );
  }

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
                    {i === todayWeekIndex && <p style={f({ fontWeight: 600, fontSize: "8px", color: t.accent, textTransform: "uppercase", marginTop: "2px" })}>This Week</p>}
                  </div>
                ))}
              </div>

              {scheduleItems.map((item, rowIndex) => (
                <div key={item.projectId} style={{
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
                          height: "8px",
                          background: item.intensity === "high" ? t.text : item.intensity === "medium" ? t.textTertiary : t.textMuted,
                          borderRadius: colIndex === item.startWeek && colIndex === item.endWeek ? "4px" : colIndex === item.startWeek ? "4px 0 0 4px" : colIndex === item.endWeek ? "0 4px 4px 0" : "0",
                          opacity: item.isPaused ? 0.3 : 0.6,
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
            {upcomingEvents.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No upcoming dates</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Set due dates on projects to see them here.</p>
              </div>
            ) : (
              upcomingEvents.map((event, i) => (
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
                    <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>{event.project} · {event.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
