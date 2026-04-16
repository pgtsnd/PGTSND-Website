import { useState, useMemo } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatPhase,
  type Project,
  type Task,
  type Deliverable,
} from "../hooks/useTeamData";
import {
  useListProjectTasks,
  useListProjectDeliverables,
} from "@workspace/api-client-react";

function useAllProjectTasks(projectIds: string[]) {
  const r0 = useListProjectTasks(projectIds[0] ?? "", { query: { enabled: !!projectIds[0] } });
  const r1 = useListProjectTasks(projectIds[1] ?? "", { query: { enabled: !!projectIds[1] } });
  const r2 = useListProjectTasks(projectIds[2] ?? "", { query: { enabled: !!projectIds[2] } });
  const r3 = useListProjectTasks(projectIds[3] ?? "", { query: { enabled: !!projectIds[3] } });
  const r4 = useListProjectTasks(projectIds[4] ?? "", { query: { enabled: !!projectIds[4] } });
  const results = [r0, r1, r2, r3, r4].slice(0, projectIds.length);
  const map = new Map<string, Task[]>();
  results.forEach((r, i) => { if (r.data) map.set(projectIds[i], r.data as Task[]); });
  return { tasksByProject: map, isLoading: results.some(r => r.isLoading) };
}

function useAllProjectDeliverables(projectIds: string[]) {
  const r0 = useListProjectDeliverables(projectIds[0] ?? "", { query: { enabled: !!projectIds[0] } });
  const r1 = useListProjectDeliverables(projectIds[1] ?? "", { query: { enabled: !!projectIds[1] } });
  const r2 = useListProjectDeliverables(projectIds[2] ?? "", { query: { enabled: !!projectIds[2] } });
  const r3 = useListProjectDeliverables(projectIds[3] ?? "", { query: { enabled: !!projectIds[3] } });
  const r4 = useListProjectDeliverables(projectIds[4] ?? "", { query: { enabled: !!projectIds[4] } });
  const results = [r0, r1, r2, r3, r4].slice(0, projectIds.length);
  const map = new Map<string, Deliverable[]>();
  results.forEach((r, i) => { if (r.data) map.set(projectIds[i], r.data as Deliverable[]); });
  return { deliverablesByProject: map, isLoading: results.some(r => r.isLoading) };
}

const PHASE_ORDER = ["pre_production", "production", "post_production", "review", "delivered"];

function getPhaseColor(phase: string, t: any) {
  switch (phase) {
    case "pre_production": return t.textMuted;
    case "production": return t.accent;
    case "post_production": return t.text;
    case "review": return t.textTertiary;
    case "delivered": return t.textMuted;
    default: return t.textMuted;
  }
}

export default function TeamSchedule() {
  const { t } = useTheme();
  const { isLoading: authLoading, userMap } = useTeamAuth();
  const { projects, isLoading } = useDashboardData();
  const [view, setView] = useState<"timeline" | "upcoming">("timeline");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const activeProjects = projects.filter((p) => p.status !== "archived");
  const projectIds = activeProjects.map(p => p.id);
  const { tasksByProject } = useAllProjectTasks(projectIds);
  const { deliverablesByProject } = useAllProjectDeliverables(projectIds);

  const { weeks, weekDates, todayWeekIndex, totalWeeks } = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);

    const rangeStart = new Date(startOfWeek);
    rangeStart.setDate(rangeStart.getDate() - 3 * 7);

    const totalWeeks = 16;
    const weeks: string[] = [];
    const weekDates: Date[] = [];
    for (let i = 0; i < totalWeeks; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i * 7);
      weekDates.push(new Date(d));
      weeks.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }

    const todayWeekIndex = 3;
    return { weeks, weekDates, todayWeekIndex, totalWeeks };
  }, []);

  const getWeekIndex = (date: Date) => {
    const rangeStart = weekDates[0];
    return Math.round((date.getTime() - rangeStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  };

  const scheduleRows = useMemo(() => {
    return activeProjects.map((p) => {
      const startDate = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      const endDate = dueDate ?? new Date(startDate.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

      const startWeek = Math.max(0, Math.min(totalWeeks - 1, getWeekIndex(startDate)));
      const endWeek = Math.max(0, Math.min(totalWeeks - 1, getWeekIndex(endDate)));

      const tasks = tasksByProject.get(p.id) ?? [];
      const deliverables = deliverablesByProject.get(p.id) ?? [];

      const milestones: { week: number; label: string; type: "task" | "deliverable" | "due"; done: boolean }[] = [];

      const doneTasks = tasks.filter(t => t.status === "done");
      const inProgressTasks = tasks.filter(t => t.status === "in_progress");
      const todoTasks = tasks.filter(t => t.status === "todo");
      const totalTasks = tasks.length;

      if (totalTasks > 0 && (endWeek - startWeek) > 1) {
        const span = endWeek - startWeek;

        const doneRatio = doneTasks.length / totalTasks;
        const doneWeek = startWeek + Math.round(doneRatio * span * 0.8);

        if (inProgressTasks.length > 0) {
          const label = inProgressTasks[0].title.length > 30
            ? inProgressTasks[0].title.slice(0, 28) + "..."
            : inProgressTasks[0].title;
          const currentWeek = Math.max(startWeek + 1, Math.min(endWeek - 1, doneWeek));
          milestones.push({ week: currentWeek, label, type: "task", done: false });
        }

        if (inProgressTasks.length > 1) {
          const label = inProgressTasks[1].title.length > 30
            ? inProgressTasks[1].title.slice(0, 28) + "..."
            : inProgressTasks[1].title;
          const w = Math.min(endWeek - 1, (doneWeek || startWeek + 1) + 1);
          if (!milestones.some(m => m.week === w)) {
            milestones.push({ week: w, label, type: "task", done: false });
          }
        }

        const nextTodo = todoTasks[0];
        if (nextTodo) {
          const label = nextTodo.title.length > 30 ? nextTodo.title.slice(0, 28) + "..." : nextTodo.title;
          const w = Math.min(endWeek, Math.max(todayWeekIndex + 1, doneWeek + 2));
          if (!milestones.some(m => m.week === w)) {
            milestones.push({ week: w, label, type: "task", done: false });
          }
        }

        deliverables.forEach((d, i) => {
          const delWeek = Math.min(endWeek, Math.max(startWeek + 2, endWeek - 2 + i));
          if (!milestones.some(m => m.week === delWeek)) {
            const label = d.title.length > 28 ? d.title.slice(0, 26) + "..." : d.title;
            milestones.push({
              week: delWeek, label, type: "deliverable",
              done: d.status === "approved",
            });
          }
        });
      }

      if (dueDate) {
        const dueWeekIdx = Math.max(0, Math.min(totalWeeks - 1, getWeekIndex(dueDate)));
        milestones.push({ week: dueWeekIdx, label: "Final Delivery", type: "due", done: p.status === "delivered" });
      }

      const phaseBarSegments: { startWeek: number; endWeek: number; phase: string }[] = [];
      const phaseIdx = PHASE_ORDER.indexOf(p.phase);
      if (phaseIdx >= 0 && endWeek > startWeek) {
        const span = endWeek - startWeek;
        let prevEnd = startWeek;
        for (let pi = 0; pi <= Math.min(phaseIdx, PHASE_ORDER.length - 1); pi++) {
          const segEnd = pi === phaseIdx
            ? endWeek
            : startWeek + Math.round((span * (pi + 1)) / (phaseIdx + 1));
          phaseBarSegments.push({
            startWeek: prevEnd,
            endWeek: Math.min(segEnd, endWeek),
            phase: PHASE_ORDER[pi],
          });
          prevEnd = segEnd;
        }
      } else {
        phaseBarSegments.push({ startWeek, endWeek, phase: p.phase });
      }

      return {
        project: p,
        startWeek,
        endWeek,
        milestones,
        phaseBarSegments,
        tasks,
        deliverables,
        isPaused: p.status === "lead",
        taskProgress: totalTasks > 0
          ? Math.round((doneTasks.length / totalTasks) * 100)
          : p.progress,
      };
    });
  }, [activeProjects, tasksByProject, deliverablesByProject, weekDates, todayWeekIndex, totalWeeks]);

  const upcomingEvents = useMemo(() => {
    const events: {
      date: string; day: string; title: string; project: string; projectId: string;
      crew: string[]; time: string; sortDate: number; type: string;
    }[] = [];

    activeProjects.forEach(p => {
      if (p.dueDate) {
        const d = new Date(p.dueDate);
        events.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          title: `${formatPhase(p.phase)} delivery`,
          project: p.name, projectId: p.id, crew: [], time: "Due date",
          sortDate: d.getTime(), type: "deadline",
        });
      }

      const tasks = tasksByProject.get(p.id) ?? [];
      const inProgress = tasks.filter(t => t.status === "in_progress");
      const pStart = p.startDate ? new Date(p.startDate).getTime() : Date.now();
      const pEnd = p.dueDate ? new Date(p.dueDate).getTime() : pStart + 90 * 24 * 60 * 60 * 1000;
      const pSpan = pEnd - pStart;

      inProgress.forEach((task, idx) => {
        const assignee = task.assigneeId ? userMap.get(task.assigneeId) : null;
        const taskDate = task.dueDate
          ? new Date(task.dueDate)
          : new Date(pStart + pSpan * (0.5 + idx * 0.1));
        events.push({
          date: taskDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          day: taskDate.toLocaleDateString("en-US", { weekday: "short" }),
          title: task.title, project: p.name, projectId: p.id,
          crew: assignee ? [assignee.name ?? "Unassigned"] : [],
          time: task.dueDate ? taskDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "In Progress",
          sortDate: taskDate.getTime(), type: "task",
        });
      });

      const deliverables = deliverablesByProject.get(p.id) ?? [];
      deliverables.filter(d => d.status !== "approved").forEach((d, idx) => {
        const delDate = new Date(pStart + pSpan * (0.7 + idx * 0.08));
        events.push({
          date: delDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          day: delDate.toLocaleDateString("en-US", { weekday: "short" }),
          title: d.title, project: p.name, projectId: p.id,
          crew: [], time: `Deliverable — ${d.status}`, sortDate: delDate.getTime(), type: "deliverable",
        });
      });
    });

    return events.sort((a, b) => a.sortDate - b.sortDate);
  }, [activeProjects, tasksByProject, deliverablesByProject, userMap]);

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
      <div style={{ padding: "32px 40px", maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={f({ fontWeight: 800, fontSize: "24px", color: t.text, marginBottom: "4px" })}>Production Schedule</h1>
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>
              {activeProjects.length} active projects · {weeks[todayWeekIndex]} — current week
            </p>
          </div>
          <div style={{ display: "flex", gap: "4px", background: t.hoverBg, borderRadius: "6px", padding: "3px" }}>
            {(["timeline", "upcoming"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={f({
                fontWeight: view === v ? 600 : 400, fontSize: "12px",
                color: view === v ? t.text : t.textMuted,
                background: view === v ? t.bgCard : "transparent",
                border: view === v ? `1px solid ${t.border}` : "1px solid transparent",
                borderRadius: "4px", padding: "6px 14px", cursor: "pointer",
                textTransform: "capitalize",
              })}>{v === "timeline" ? "Gantt" : "Upcoming"}</button>
            ))}
          </div>
        </div>

        {view === "timeline" && (
          <div>
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${totalWeeks}, 1fr)`, borderBottom: `2px solid ${t.border}` }}>
                <div style={{ padding: "14px 20px", borderRight: `1px solid ${t.border}` }}>
                  <p style={f({ fontWeight: 700, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" })}>Project</p>
                </div>
                {weeks.map((week, i) => (
                  <div key={i} style={{
                    padding: "10px 4px", textAlign: "center",
                    borderLeft: `1px solid ${i === todayWeekIndex ? t.accent : t.borderSubtle}`,
                    background: i === todayWeekIndex ? "rgba(255,255,255,0.04)" : "transparent",
                    position: "relative",
                  }}>
                    <p style={f({ fontWeight: i === todayWeekIndex ? 700 : 400, fontSize: "9px", color: i === todayWeekIndex ? t.text : t.textMuted })}>{week}</p>
                    {i === todayWeekIndex && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, width: "2px", height: "100%",
                        background: t.accent,
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {scheduleRows.map((row, rowIndex) => {
                const isExpanded = expandedProject === row.project.id;
                return (
                  <div key={row.project.id}>
                    <div
                      onClick={() => setExpandedProject(isExpanded ? null : row.project.id)}
                      style={{
                        display: "grid", gridTemplateColumns: `200px repeat(${totalWeeks}, 1fr)`,
                        borderBottom: `1px solid ${t.borderSubtle}`,
                        minHeight: "72px", alignItems: "center", cursor: "pointer",
                        background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent",
                      }}
                    >
                      <div style={{ padding: "12px 16px", borderRight: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                          <div>
                            <p style={f({ fontWeight: 700, fontSize: "12px", color: t.text, marginBottom: "2px" })}>{row.project.name}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={f({ fontWeight: 500, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                                {formatPhase(row.project.phase)}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                <div style={{ width: "40px", height: "3px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
                                  <div style={{ width: `${row.taskProgress}%`, height: "100%", background: t.accent, borderRadius: "2px" }} />
                                </div>
                                <span style={f({ fontWeight: 600, fontSize: "8px", color: t.textMuted })}>{row.taskProgress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {weeks.map((_, colIndex) => {
                        const isInBar = colIndex >= row.startWeek && colIndex <= row.endWeek;
                        const segment = row.phaseBarSegments.find(s => colIndex >= s.startWeek && colIndex <= s.endWeek);
                        const milestone = row.milestones.find(m => m.week === colIndex);

                        return (
                          <div key={colIndex} style={{
                            borderLeft: `1px solid ${colIndex === todayWeekIndex ? t.accent : t.borderSubtle}`,
                            height: "100%", padding: "0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative",
                            background: colIndex === todayWeekIndex ? "rgba(255,255,255,0.02)" : "transparent",
                          }}>
                            {colIndex === todayWeekIndex && (
                              <div style={{
                                position: "absolute", top: 0, left: 0, width: "2px", height: "100%",
                                background: t.accent, zIndex: 3,
                              }} />
                            )}

                            {isInBar && segment && (
                              <div style={{
                                position: "absolute",
                                left: colIndex === segment.startWeek ? "4px" : "0",
                                right: colIndex === segment.endWeek ? "4px" : "0",
                                height: "12px",
                                background: getPhaseColor(segment.phase, t),
                                opacity: row.isPaused ? 0.15 : 0.4,
                                borderRadius:
                                  colIndex === row.startWeek && colIndex === row.endWeek ? "6px" :
                                  colIndex === row.startWeek ? "6px 0 0 6px" :
                                  colIndex === row.endWeek ? "0 6px 6px 0" : "0",
                              }} />
                            )}

                            {milestone && (
                              <div style={{
                                position: "absolute", zIndex: 4,
                                display: "flex", flexDirection: "column", alignItems: "center",
                                top: "6px",
                              }}>
                                <div style={{
                                  width: milestone.type === "due" ? "10px" : "8px",
                                  height: milestone.type === "due" ? "10px" : "8px",
                                  transform: "rotate(45deg)",
                                  background: milestone.type === "due"
                                    ? t.accent
                                    : milestone.type === "deliverable"
                                    ? t.text
                                    : t.textTertiary,
                                  border: `2px solid ${t.bgCard}`,
                                  opacity: milestone.done ? 0.4 : 1,
                                  flexShrink: 0,
                                }} />
                                <p style={f({
                                  fontWeight: 600, fontSize: "7px",
                                  color: milestone.done ? t.textMuted : t.textSecondary,
                                  marginTop: "4px",
                                  whiteSpace: "nowrap",
                                  maxWidth: "60px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  textAlign: "center",
                                  lineHeight: "1.1",
                                  textDecoration: milestone.done ? "line-through" : "none",
                                })}>{milestone.label.length > 14 ? milestone.label.slice(0, 12) + ".." : milestone.label}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isExpanded && (
                      <div style={{
                        gridColumn: "1 / -1",
                        background: "rgba(255,255,255,0.015)",
                        borderBottom: `1px solid ${t.border}`,
                        padding: "16px 20px 16px 52px",
                      }}>
                        <div style={{ display: "flex", gap: "32px", marginBottom: "16px" }}>
                          <div>
                            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Start</p>
                            <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>
                              {row.project.startDate ? new Date(row.project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </p>
                          </div>
                          <div>
                            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Due</p>
                            <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>
                              {row.project.dueDate ? new Date(row.project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </p>
                          </div>
                          <div>
                            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Tasks</p>
                            <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>
                              {row.tasks.filter(t => t.status === "done").length}/{row.tasks.length} complete
                            </p>
                          </div>
                          <div>
                            <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>Deliverables</p>
                            <p style={f({ fontWeight: 600, fontSize: "12px", color: t.text })}>
                              {row.deliverables.length} items
                            </p>
                          </div>
                        </div>

                        <p style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" })}>Milestones</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                          {row.milestones.map((m, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", gap: "6px",
                              padding: "4px 10px", borderRadius: "4px",
                              background: m.done ? "rgba(255,255,255,0.03)" : t.hoverBg,
                              border: `1px solid ${t.borderSubtle}`,
                            }}>
                              <div style={{
                                width: "6px", height: "6px", transform: "rotate(45deg)",
                                background: m.type === "due" ? t.accent : m.type === "deliverable" ? t.text : t.textTertiary,
                                opacity: m.done ? 0.4 : 1,
                              }} />
                              <span style={f({
                                fontWeight: 500, fontSize: "10px",
                                color: m.done ? t.textMuted : t.textSecondary,
                                textDecoration: m.done ? "line-through" : "none",
                              })}>{m.label}</span>
                              <span style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted })}>Wk {m.week - row.startWeek + 1}</span>
                            </div>
                          ))}
                          {row.milestones.length === 0 && (
                            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>No milestones set</p>
                          )}
                        </div>

                        <Link href={`/team/projects/${row.project.id}`} style={{ textDecoration: "none" }}>
                          <span style={f({ fontWeight: 600, fontSize: "11px", color: t.accent, cursor: "pointer" })}>
                            View project details →
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "12px", display: "flex", gap: "24px", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "2px", height: "14px", background: t.accent }} />
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Today</span>
              </div>
              {PHASE_ORDER.slice(0, 3).map(phase => (
                <div key={phase} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "20px", height: "6px", background: getPhaseColor(phase, t), borderRadius: "3px", opacity: 0.5 }} />
                  <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "capitalize" })}>
                    {phase.replace("_", " ").replace("pre ", "Pre-").replace("post ", "Post-")}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", transform: "rotate(45deg)", background: t.accent }} />
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Deadline</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "7px", height: "7px", transform: "rotate(45deg)", background: t.textTertiary }} />
                <span style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted })}>Milestone</span>
              </div>
            </div>
          </div>
        )}

        {view === "upcoming" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <p style={f({ fontWeight: 600, fontSize: "14px", color: t.text, marginBottom: "4px" })}>No upcoming items</p>
                <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Tasks and deliverables with due dates will appear here.</p>
              </div>
            ) : (
              upcomingEvents.map((event, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "20px",
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px",
                  padding: "18px 24px",
                }}>
                  <div style={{ textAlign: "center", minWidth: "48px" }}>
                    <p style={f({ fontWeight: 700, fontSize: "16px", color: t.text })}>{event.date.split(" ")[1]}</p>
                    <p style={f({ fontWeight: 500, fontSize: "9px", color: t.textMuted, textTransform: "uppercase" })}>{event.date.split(" ")[0]}</p>
                    <p style={f({ fontWeight: 400, fontSize: "9px", color: t.textMuted })}>{event.day}</p>
                  </div>
                  <div style={{ width: "1px", background: t.border, alignSelf: "stretch" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: event.type === "deadline" ? t.accent : event.type === "deliverable" ? t.text : t.textTertiary,
                      }} />
                      <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text })}>{event.title}</p>
                    </div>
                    <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: event.crew.length > 0 ? "8px" : "0" })}>
                      {event.project} · {event.time}
                    </p>
                    {event.crew.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {event.crew.map((c) => (
                          <span key={c} style={f({
                            fontWeight: 500, fontSize: "10px", color: t.textTertiary,
                            background: t.hoverBg, padding: "3px 10px", borderRadius: "4px",
                            border: `1px solid ${t.borderSubtle}`,
                          })}>{c}</span>
                        ))}
                      </div>
                    )}
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
