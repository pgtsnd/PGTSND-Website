import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import {
  useDashboardData,
  formatPhase,
  formatDate,
  daysUntil,
  isActiveStatus,
  type Project,
} from "../hooks/useTeamData";
import { api, type Phase } from "../lib/api";

function CircleProgress({ progress, size = 80, stroke = 6 }: { progress: number; size?: number; stroke?: number }) {
  const { t } = useTheme();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.accent} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

const PHASE_COLORS = [
  "rgba(120,180,255,0.85)",
  "rgba(100,220,160,0.85)",
  "rgba(255,180,80,0.85)",
  "rgba(200,130,255,0.85)",
  "rgba(255,120,120,0.85)",
];

function dayStart(d: Date | string) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function ProjectGantt({ project, phases }: { project: Project; phases: Phase[] }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const sortedPhases = phases
    .filter((p) => p.startDate && p.endDate)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedPhases.length === 0) return null;

  const earliest = dayStart(
    new Date(Math.min(...sortedPhases.map((p) => new Date(p.startDate!).getTime()))),
  );
  const latestInclusive = dayStart(
    new Date(Math.max(...sortedPhases.map((p) => new Date(p.endDate!).getTime()))),
  );
  const latestExcl = addDays(latestInclusive, 1);

  const startWeek = dayStart(earliest);
  startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const endWeek = addDays(latestExcl, 6 - latestExcl.getDay() + 1);
  const span = endWeek.getTime() - startWeek.getTime();
  const totalWeeks = Math.round(span / (7 * 86400000));

  const weeks: Date[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    weeks.push(addDays(startWeek, i * 7));
  }

  const today = dayStart(new Date());
  const todayOffset = ((today.getTime() - startWeek.getTime()) / span) * 100;
  const showToday = todayOffset >= 0 && todayOffset <= 100;

  const months: { label: string; startPct: number; widthPct: number }[] = [];
  let cursor = new Date(startWeek);
  while (cursor < endWeek) {
    const mStart = new Date(cursor);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const clampedEnd = nextMonth > endWeek ? endWeek : nextMonth;
    const startPct = ((mStart.getTime() - startWeek.getTime()) / span) * 100;
    const endPct = ((clampedEnd.getTime() - startWeek.getTime()) / span) * 100;
    months.push({
      label: mStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      startPct,
      widthPct: endPct - startPct,
    });
    cursor = nextMonth;
  }

  const labelWidth = 140;

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex" }}>
        <div style={{ width: `${labelWidth}px`, flexShrink: 0 }} />
        <div style={{ flex: 1, position: "relative", height: "20px", overflow: "hidden" }}>
          {months.map((m, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${m.startPct}%`,
                width: `${m.widthPct}%`,
                top: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                borderLeft: i > 0 ? `1px solid ${t.borderSubtle}` : "none",
                paddingLeft: "4px",
              }}
            >
              <span style={f({ fontWeight: 600, fontSize: "9px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" })}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div style={{ width: `${labelWidth}px`, flexShrink: 0 }} />
        <div style={{ flex: 1, position: "relative", height: "1px", background: t.borderSubtle }}>
          {weeks.map((_, i) => {
            const pct = (i / totalWeeks) * 100;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "-2px",
                  width: "1px",
                  height: "5px",
                  background: t.borderSubtle,
                }}
              />
            );
          })}
        </div>
      </div>

      {sortedPhases.map((phase, i) => {
        const phaseStart = dayStart(phase.startDate!);
        const phaseEndIncl = dayStart(phase.endDate!);
        const phaseEndExcl = addDays(phaseEndIncl, 1);
        const leftPct = ((phaseStart.getTime() - startWeek.getTime()) / span) * 100;
        const widthPct = ((phaseEndExcl.getTime() - phaseStart.getTime()) / span) * 100;

        let fillPct = 0;
        if (today >= phaseEndIncl) fillPct = 100;
        else if (today > phaseStart)
          fillPct = ((today.getTime() - phaseStart.getTime()) / (phaseEndExcl.getTime() - phaseStart.getTime())) * 100;

        const color = PHASE_COLORS[i % PHASE_COLORS.length];
        const bgColor = color.replace("0.85", "0.15");

        return (
          <div key={phase.id} style={{ display: "flex", alignItems: "center", height: "32px" }}>
            <div style={{ width: `${labelWidth}px`, flexShrink: 0, paddingRight: "12px" }}>
              <span style={f({ fontWeight: 600, fontSize: "11px", color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" })}>
                {phase.name}
              </span>
            </div>
            <div style={{ flex: 1, position: "relative", height: "20px" }}>
              <div
                style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.5)}%`,
                  top: "2px",
                  height: "16px",
                  borderRadius: "3px",
                  background: bgColor,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fillPct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: "3px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {showToday && (
        <div style={{ display: "flex", marginTop: "-4px" }}>
          <div style={{ width: `${labelWidth}px`, flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative", height: "0" }}>
            <div
              style={{
                position: "absolute",
                left: `${todayOffset}%`,
                top: `-${sortedPhases.length * 32 + 21}px`,
                width: "1.5px",
                height: `${sortedPhases.length * 32 + 21}px`,
                background: "rgba(255,90,90,0.6)",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `calc(${todayOffset}% - 16px)`,
                top: "2px",
              }}
            >
              <span style={f({ fontWeight: 700, fontSize: "8px", color: "rgba(255,90,90,0.8)", textTransform: "uppercase", letterSpacing: "0.04em" })}>
                Today
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleSection({ projects }: { projects: Project[] }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phasesMap, setPhasesMap] = useState<Record<string, Phase[]>>({});

  const nonArchived = projects.filter((p) => p.status !== "archived");
  const projectIds = useMemo(() => nonArchived.map((p) => p.id).sort().join(","), [nonArchived]);

  useEffect(() => {
    nonArchived.forEach((p) => {
      if (!phasesMap[p.id]) {
        api.getProjectPhases(p.id).then((phases) => {
          setPhasesMap((prev) => ({ ...prev, [p.id]: phases }));
        }).catch(() => {});
      }
    });
  }, [projectIds]);

  return (
    <div style={{ marginTop: "40px" }}>
      <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
        Production Schedule
      </h2>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden" }}>
        {nonArchived.map((project, i) => {
          const isExpanded = expandedId === project.id;
          const phases = phasesMap[project.id] || [];
          const phasesWithDates = phases.filter((p) => p.startDate && p.endDate).sort((a, b) => a.sortOrder - b.sortOrder);

          const now = dayStart(new Date());
          let currentPhaseName = "";
          for (const phase of phasesWithDates) {
            const s = dayStart(phase.startDate!);
            const e = dayStart(phase.endDate!);
            if (now >= s && now <= e) {
              currentPhaseName = phase.name;
              break;
            }
          }
          if (!currentPhaseName && phasesWithDates.length > 0) {
            const last = phasesWithDates[phasesWithDates.length - 1];
            if (now > dayStart(last.endDate!)) currentPhaseName = "Complete";
            else currentPhaseName = phasesWithDates[0].name;
          }

          return (
            <div key={project.id}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 20px",
                  cursor: "pointer",
                  borderBottom: (i < nonArchived.length - 1 || isExpanded) ? `1px solid ${t.borderSubtle}` : "none",
                  gap: "12px",
                }}
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5"
                  style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
                    {project.name}
                  </p>
                </div>
                {currentPhaseName && (
                  <span style={f({
                    fontWeight: 500, fontSize: "10px", color: t.textMuted,
                    background: t.hoverBg, padding: "3px 10px", borderRadius: "4px",
                    whiteSpace: "nowrap",
                  })}>
                    {currentPhaseName}
                  </span>
                )}
                <div style={{ width: "60px", textAlign: "right" }}>
                  <span style={f({ fontWeight: 700, fontSize: "13px", color: t.text })}>{project.progress}%</span>
                </div>
                <div style={{ width: "80px", height: "4px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    width: `${project.progress}%`,
                    height: "100%",
                    background: project.progress === 100 ? t.accent : "rgba(120,180,255,0.7)",
                    borderRadius: "2px",
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
              {isExpanded && phases.length > 0 && (
                <div style={{ padding: "8px 20px 20px 20px", background: t.bg }}>
                  <ProjectGantt project={project} phases={phases} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamDashboard() {
  const { t } = useTheme();
  const { currentUser, isLoading: authLoading } = useTeamAuth();
  const { projects, users, isLoading } = useDashboardData();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <div style={{ padding: "40px 48px" }}>
          <p style={f({ fontWeight: 400, fontSize: "14px", color: t.textMuted })}>Loading dashboard...</p>
        </div>
      </TeamLayout>
    );
  }

  const activeProjects = projects.filter((p) => isActiveStatus(p.status));
  const displayProjects = projects.filter((p) => p.status !== "archived");

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const activeBudget = activeProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const deliveredBudget = projects
    .filter((p) => p.status === "delivered")
    .reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <TeamLayout>
      <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={f({ fontWeight: 400, fontSize: "13px", color: t.textMuted, marginBottom: "4px" })}>Welcome back,</p>
          <h1 style={f({ fontWeight: 800, fontSize: "28px", color: t.text, marginBottom: "4px" })}>
            {currentUser?.name?.split(" ")[0] ?? "Team"}
          </h1>
          <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted })}>Here's what needs your attention today.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "40px" }}>
          {displayProjects.slice(0, 6).map((p) => {
            const isPaused = p.status === "lead";
            const days = daysUntil(p.dueDate);
            return (
              <Link key={p.id} href={`/team/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "12px",
                  padding: "24px", cursor: "pointer", opacity: isPaused ? 0.5 : 1,
                  position: "relative", overflow: "hidden",
                }}>
                  {isPaused && (
                    <div style={f({
                      position: "absolute", top: "12px", right: "12px",
                      fontWeight: 600, fontSize: "9px", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: "rgba(255,200,60,0.8)",
                      background: "rgba(255,200,60,0.08)", padding: "3px 10px", borderRadius: "4px",
                    })}>Paused</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                    <CircleProgress progress={p.progress} size={72} stroke={5} />
                    <div>
                      <p style={f({ fontWeight: 800, fontSize: "28px", color: t.text, lineHeight: 1 })}>{p.progress}%</p>
                      <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" })}>complete</p>
                    </div>
                  </div>
                  <p style={f({ fontWeight: 700, fontSize: "15px", color: t.text, marginBottom: "4px" })}>{p.name}</p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted, marginBottom: "14px" })}>{p.organizationName}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, background: t.hoverBg, padding: "4px 10px", borderRadius: "4px" })}>{formatPhase(p.phase)}</span>
                    {days !== null && days > 0 && (
                      <span style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{days}d left</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div>
          <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
            Revenue Snapshot
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
            {[
              { label: "Active Projects", value: `$${activeBudget.toLocaleString()}`, sub: `${activeProjects.length} projects in progress` },
              { label: "Delivered", value: `$${deliveredBudget.toLocaleString()}`, sub: `${projects.filter(p => p.status === "delivered").length} completed projects` },
              { label: "Pipeline Total", value: `$${totalBudget.toLocaleString()}`, sub: `Across ${projects.length} projects` },
              { label: "Active Count", value: `${activeProjects.length}`, sub: `${projects.length} total projects` },
            ].map((stat) => (
              <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "20px" }}>
                <p style={f({ fontWeight: 400, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" })}>{stat.label}</p>
                <p style={f({ fontWeight: 800, fontSize: "22px", color: t.text, marginBottom: "4px" })}>{stat.value}</p>
                <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textMuted })}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <ScheduleSection projects={projects} />
      </div>
    </TeamLayout>
  );
}
