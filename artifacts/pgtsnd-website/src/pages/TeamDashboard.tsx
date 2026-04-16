import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import TeamLayout from "../components/TeamLayout";
import { useTheme } from "../components/ThemeContext";
import { useTeamAuth } from "../contexts/TeamAuthContext";
import { DashboardSkeleton, ErrorState } from "../components/TeamLoadingStates";
import {
  useDashboardData,
  formatPhase,
  formatDate,
  daysUntil,
  type Project,
} from "../hooks/useTeamData";
import { useListInvoices } from "@workspace/api-client-react";
import type { Invoice } from "@workspace/api-client-react/src/generated/api.schemas";
import { api, type Phase } from "../lib/api";

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

function fmtUsd(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

function pctChange(current: number, prior: number): { value: number; label: string; up: boolean } {
  if (prior === 0) {
    if (current === 0) return { value: 0, label: "—", up: true };
    return { value: 100, label: "new", up: true };
  }
  const v = ((current - prior) / Math.abs(prior)) * 100;
  return {
    value: v,
    label: `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`,
    up: v >= 0,
  };
}

// ───────────────────────── Revenue computations ─────────────────────────

type RevenueStats = {
  thisMonthPaid: number;
  lastMonthPaid: number;
  sameMonthLastYearPaid: number;
  ytdPaid: number;
  lastYearSamePeriod: number;
  lastYearTotal: number;
  outstandingSent: number;
  outstandingDraft: number;
  outstandingOverdue: number;
  forecastYearEnd: number;
  monthly12: { label: string; paid: number; date: Date }[];
  upcomingDue: Invoice[];
  overdueInvoices: Invoice[];
};

function computeRevenue(invoices: Invoice[]): RevenueStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const ymKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  const paidByYm = new Map<string, number>();
  let thisMonthPaid = 0;
  let lastMonthPaid = 0;
  let sameMonthLastYearPaid = 0;
  let ytdPaid = 0;
  let lastYearSamePeriod = 0;
  let lastYearTotal = 0;
  let outstandingSent = 0;
  let outstandingDraft = 0;
  let outstandingOverdue = 0;
  const upcomingDue: Invoice[] = [];
  const overdueInvoices: Invoice[] = [];

  const lastMonth = new Date(thisYear, thisMonth - 1, 1);
  const lastMonthMonth = lastMonth.getMonth();
  const lastMonthYear = lastMonth.getFullYear();

  for (const inv of invoices) {
    if (inv.status === "paid") {
      const paidAt = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.updatedAt);
      const k = ymKey(paidAt);
      paidByYm.set(k, (paidByYm.get(k) ?? 0) + inv.amount);

      if (paidAt.getFullYear() === thisYear && paidAt.getMonth() === thisMonth) {
        thisMonthPaid += inv.amount;
      }
      if (paidAt.getFullYear() === lastMonthYear && paidAt.getMonth() === lastMonthMonth) {
        lastMonthPaid += inv.amount;
      }
      if (paidAt.getFullYear() === thisYear - 1 && paidAt.getMonth() === thisMonth) {
        sameMonthLastYearPaid += inv.amount;
      }
      if (paidAt.getFullYear() === thisYear) {
        ytdPaid += inv.amount;
      }
      if (paidAt.getFullYear() === thisYear - 1) {
        lastYearTotal += inv.amount;
        // YTD comparison: same months elapsed last year
        if (paidAt.getMonth() <= thisMonth) {
          lastYearSamePeriod += inv.amount;
        }
      }
    } else if (inv.status === "sent") {
      const due = inv.dueDate ? dayStart(inv.dueDate) : null;
      const todayStart = dayStart(now);
      if (due && due.getTime() < todayStart.getTime()) {
        // Past due: classify as overdue only (mutually exclusive)
        overdueInvoices.push(inv);
        outstandingOverdue += inv.amount;
      } else {
        outstandingSent += inv.amount;
        if (due) upcomingDue.push(inv);
      }
    } else if (inv.status === "draft") {
      outstandingDraft += inv.amount;
    } else if (inv.status === "overdue") {
      outstandingOverdue += inv.amount;
      overdueInvoices.push(inv);
    }
  }

  // Trailing 12 months
  const monthly12: { label: string; paid: number; date: Date }[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const k = ymKey(d);
    monthly12.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      paid: paidByYm.get(k) ?? 0,
      date: d,
    });
  }

  // Forecast: simple linear extrapolation = (YTD / monthsElapsed) * 12
  const monthsElapsed = thisMonth + 1;
  const runRate = ytdPaid / Math.max(1, monthsElapsed);
  const forecastYearEnd = ytdPaid + runRate * (12 - monthsElapsed);

  upcomingDue.sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db_ = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return da - db_;
  });

  return {
    thisMonthPaid,
    lastMonthPaid,
    sameMonthLastYearPaid,
    ytdPaid,
    lastYearSamePeriod,
    lastYearTotal,
    outstandingSent,
    outstandingDraft,
    outstandingOverdue,
    forecastYearEnd,
    monthly12,
    upcomingDue,
    overdueInvoices,
  };
}

// ───────────────────────── UI parts ─────────────────────────

function TodayBar({
  projects,
  rev,
}: {
  projects: Project[];
  rev: RevenueStats;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const dueSoon = projects.filter((p) => {
    const d = daysUntil(p.dueDate);
    return p.status !== "archived" && p.status !== "delivered" && d !== null && d >= 0 && d <= 7;
  });
  const inReview = projects.filter((p) => p.status === "review");

  const items: Array<{
    key: string;
    label: string;
    value: string;
    tone: "danger" | "warning" | "info" | "success";
    href: string;
  }> = [];

  if (rev.overdueInvoices.length > 0) {
    items.push({
      key: "overdue",
      label: "Overdue invoices",
      value: `${rev.overdueInvoices.length} · ${fmtUsd(rev.outstandingOverdue, { compact: true })}`,
      tone: "danger",
      href: "/team/clients",
    });
  }
  if (dueSoon.length > 0) {
    items.push({
      key: "duesoon",
      label: "Projects due in 7 days",
      value: `${dueSoon.length}`,
      tone: "warning",
      href: "/team/projects",
    });
  }
  if (inReview.length > 0) {
    items.push({
      key: "review",
      label: "In review with client",
      value: `${inReview.length}`,
      tone: "info",
      href: "/team/projects",
    });
  }
  if (rev.upcomingDue.length > 0) {
    const nextSeven = rev.upcomingDue.filter((i) => {
      if (!i.dueDate) return false;
      const d = (new Date(i.dueDate).getTime() - Date.now()) / 86400000;
      return d >= 0 && d <= 7;
    });
    if (nextSeven.length > 0) {
      items.push({
        key: "invsoon",
        label: "Invoices due ≤7 days",
        value: `${nextSeven.length} · ${fmtUsd(nextSeven.reduce((s, i) => s + i.amount, 0), { compact: true })}`,
        tone: "info",
        href: "/team/clients",
      });
    }
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "10px",
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          marginBottom: "28px",
        }}
        data-testid="today-bar-clear"
      >
        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.text })}>
          You're clear today. Nothing overdue or due in the next week.
        </p>
      </div>
    );
  }

  const toneColors: Record<string, { bg: string; border: string; text: string; chip: string }> = {
    danger: {
      bg: "rgba(255,90,90,0.08)",
      border: "rgba(255,90,90,0.35)",
      text: "#ff6b6b",
      chip: "rgba(255,90,90,0.18)",
    },
    warning: {
      bg: "rgba(255,180,60,0.08)",
      border: "rgba(255,180,60,0.3)",
      text: "rgba(255,200,80,1)",
      chip: "rgba(255,180,60,0.18)",
    },
    info: {
      bg: "rgba(120,180,255,0.06)",
      border: "rgba(120,180,255,0.25)",
      text: "rgba(140,190,255,1)",
      chip: "rgba(120,180,255,0.16)",
    },
    success: {
      bg: "rgba(100,220,160,0.06)",
      border: "rgba(100,220,160,0.25)",
      text: "rgba(120,225,170,1)",
      chip: "rgba(100,220,160,0.16)",
    },
  };

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
      {items.map((it) => {
        const c = toneColors[it.tone];
        return (
          <Link key={it.key} href={it.href} style={{ textDecoration: "none", flex: "1 1 200px" }}>
            <div
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "10px",
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
              data-testid={`today-${it.key}`}
            >
              <div>
                <p style={f({ fontWeight: 600, fontSize: "11px", color: t.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" })}>
                  {it.label}
                </p>
                <p style={f({ fontWeight: 800, fontSize: "18px", color: c.text })}>{it.value}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ChangeBadge({ change, prefix }: { change: ReturnType<typeof pctChange>; prefix?: string }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  if (change.label === "—") {
    return (
      <span style={f({ fontWeight: 600, fontSize: "11px", color: t.textTertiary })}>
        {prefix} —
      </span>
    );
  }
  const color = change.up ? "rgba(120,225,170,1)" : "rgba(255,140,140,1)";
  return (
    <span style={f({ fontWeight: 700, fontSize: "11px", color, display: "inline-flex", alignItems: "center", gap: "4px" })}>
      <span>{change.up ? "▲" : "▼"}</span>
      <span>
        {prefix} {change.label}
      </span>
    </span>
  );
}

function Sparkline({ values, color = "rgba(120,180,255,0.85)", height = 60 }: { values: number[]; color?: string; height?: number }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${height}px`, width: "100%" }}>
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div
              style={{
                width: "100%",
                height: `${h}px`,
                background: i === values.length - 1 ? color : color.replace("0.85", "0.45"),
                borderRadius: "2px 2px 0 0",
                transition: "height 0.3s ease",
              }}
              title={fmtUsd(v)}
            />
          </div>
        );
      })}
      <div
        aria-hidden
        style={f({ position: "absolute", visibility: "hidden", color: t.textMuted })}
      />
    </div>
  );
}

function RevenuePanel({ rev }: { rev: RevenueStats }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const mom = pctChange(rev.thisMonthPaid, rev.lastMonthPaid);
  const yoy = pctChange(rev.thisMonthPaid, rev.sameMonthLastYearPaid);
  const ytdYoY = pctChange(rev.ytdPaid, rev.lastYearSamePeriod);
  const forecastVsLastYear = pctChange(rev.forecastYearEnd, rev.lastYearTotal);

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted })}>
          Revenue
        </h2>
        <Link href="/team/clients" style={{ textDecoration: "none" }}>
          <span style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary })}>
            View invoices →
          </span>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "14px",
        }}
      >
        {/* Big "this month" + sparkline card */}
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          data-testid="revenue-this-month"
        >
          <div>
            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" })}>
              Paid this month ·{" "}
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "10px" }}>
              <p style={f({ fontWeight: 800, fontSize: "36px", color: t.text, lineHeight: 1 })}>
                {fmtUsd(rev.thisMonthPaid)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <ChangeBadge change={mom} prefix="MoM" />
                <ChangeBadge change={yoy} prefix="YoY" />
              </div>
            </div>
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary })}>
              Last month: {fmtUsd(rev.lastMonthPaid)} · same month last year: {fmtUsd(rev.sameMonthLastYearPaid)}
            </p>
          </div>

          <div style={{ marginTop: "20px" }}>
            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" })}>
              Trailing 12 months · paid revenue
            </p>
            <Sparkline values={rev.monthly12.map((m) => m.paid)} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={f({ fontWeight: 500, fontSize: "9px", color: t.textTertiary })}>
                {rev.monthly12[0]?.label} {rev.monthly12[0]?.date.getFullYear() !== new Date().getFullYear() ? `'${String(rev.monthly12[0].date.getFullYear()).slice(2)}` : ""}
              </span>
              <span style={f({ fontWeight: 500, fontSize: "9px", color: t.textTertiary })}>
                {rev.monthly12[rev.monthly12.length - 1]?.label}
              </span>
            </div>
          </div>
        </div>

        {/* YTD + Forecast + Outstanding card */}
        <div
          style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
          data-testid="revenue-ytd-forecast"
        >
          <div>
            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" })}>
              YTD paid · {new Date().getFullYear()}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <p style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>
                {fmtUsd(rev.ytdPaid)}
              </p>
              <ChangeBadge change={ytdYoY} prefix="vs last yr" />
            </div>
          </div>

          <div style={{ height: "1px", background: t.borderSubtle }} />

          <div>
            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" })}>
              Forecast — full year (run-rate)
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <p style={f({ fontWeight: 800, fontSize: "24px", color: t.text })}>
                {fmtUsd(rev.forecastYearEnd)}
              </p>
              <ChangeBadge change={forecastVsLastYear} prefix="vs last yr total" />
            </div>
            <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "4px" })}>
              Last year total: {fmtUsd(rev.lastYearTotal)}
            </p>
          </div>

          <div style={{ height: "1px", background: t.borderSubtle }} />

          <div>
            <p style={f({ fontWeight: 600, fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" })}>
              Outstanding
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { l: "Sent", v: rev.outstandingSent, c: "rgba(140,190,255,1)" },
                { l: "Draft", v: rev.outstandingDraft, c: t.text },
                { l: "Overdue", v: rev.outstandingOverdue, c: "#ff6b6b" },
              ].map((o) => (
                <div key={o.l}>
                  <p style={f({ fontWeight: 500, fontSize: "10px", color: t.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" })}>
                    {o.l}
                  </p>
                  <p style={f({ fontWeight: 700, fontSize: "14px", color: o.c, marginTop: "2px" })}>
                    {fmtUsd(o.v, { compact: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlannedInvoicesPanel({
  rev,
  projectMap,
}: {
  rev: RevenueStats;
  projectMap: Map<string, Project>;
}) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  // Top 5 upcoming + overdue together, sorted by due date
  const all = [...rev.overdueInvoices, ...rev.upcomingDue]
    .filter((inv, idx, arr) => arr.findIndex((x) => x.id === inv.id) === idx)
    .sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db_ = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db_;
    })
    .slice(0, 6);

  if (all.length === 0) return null;

  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
        Planned & overdue invoices
      </h2>
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {all.map((inv, i) => {
          const project = projectMap.get(inv.projectId);
          const dueDays = inv.dueDate ? daysUntil(inv.dueDate) : null;
          const isOverdue = inv.status === "overdue" || (dueDays !== null && dueDays < 0);
          return (
            <Link
              key={inv.id}
              href={project ? `/team/projects/${project.id}` : "/team/clients"}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: i < all.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                  cursor: "pointer",
                }}
                data-testid={`planned-inv-${inv.id}`}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {inv.description || `Invoice ${inv.invoiceNumber ?? inv.id.slice(0, 6)}`}
                  </p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "2px" })}>
                    {project?.name ?? "Unknown project"}
                  </p>
                </div>
                <span
                  style={f({
                    fontWeight: 600,
                    fontSize: "10px",
                    color: t.textTertiary,
                    background: t.hoverBg,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  })}
                >
                  {inv.status}
                </span>
                <span
                  style={f({
                    fontWeight: 500,
                    fontSize: "11px",
                    color: isOverdue ? "#ff6b6b" : t.textTertiary,
                    minWidth: "90px",
                    textAlign: "right" as const,
                  })}
                >
                  {inv.dueDate
                    ? isOverdue
                      ? `${Math.abs(dueDays!)}d overdue`
                      : dueDays === 0
                      ? "Due today"
                      : `Due in ${dueDays}d`
                    : "No due date"}
                </span>
                <span style={f({ fontWeight: 800, fontSize: "14px", color: t.text, minWidth: "80px", textAlign: "right" as const })}>
                  {fmtUsd(inv.amount)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NeedsAttentionPanel({ projects }: { projects: Project[] }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const scored = projects
    .filter((p) => p.status !== "archived" && p.status !== "delivered")
    .map((p) => {
      const dleft = daysUntil(p.dueDate);
      // Urgency = stale-progress + close-to-due-date
      let urgency = 0;
      if (dleft !== null) {
        if (dleft < 0) urgency += 1000 + Math.abs(dleft);
        else if (dleft <= 7) urgency += 500 - dleft * 10;
        else if (dleft <= 30) urgency += 200 - dleft;
        else urgency += 50;
      }
      if (p.status === "review") urgency += 80;
      if (p.status === "lead") urgency += 30;
      urgency += Math.max(0, 100 - p.progress) * 0.3;
      return { p, urgency, dleft };
    })
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 6);

  if (scored.length === 0) {
    return (
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <p style={f({ fontWeight: 600, fontSize: "13px", color: t.textTertiary })}>
          No active projects right now.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
        Needs attention · top {scored.length}
      </h2>
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {scored.map(({ p, dleft }, i) => {
          const isOverdue = dleft !== null && dleft < 0;
          const isSoon = dleft !== null && dleft >= 0 && dleft <= 7;
          return (
            <Link key={p.id} href={`/team/projects/${p.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto auto",
                  gap: "14px",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: i < scored.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                  cursor: "pointer",
                }}
                data-testid={`attn-${p.id}`}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {p.name}
                  </p>
                  <p style={f({ fontWeight: 400, fontSize: "11px", color: t.textTertiary, marginTop: "2px" })}>
                    {(p as Project & { organizationName?: string }).organizationName || "—"}
                  </p>
                </div>
                <span
                  style={f({
                    fontWeight: 500,
                    fontSize: "10px",
                    color: t.textMuted,
                    background: t.hoverBg,
                    padding: "3px 9px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  })}
                >
                  {formatPhase(p.phase)}
                </span>
                <div style={{ width: "120px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, height: "4px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${p.progress}%`,
                        height: "100%",
                        background: t.accent,
                        borderRadius: "2px",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span style={f({ fontWeight: 700, fontSize: "11px", color: t.text, minWidth: "32px", textAlign: "right" as const })}>
                    {p.progress}%
                  </span>
                </div>
                <span
                  style={f({
                    fontWeight: 600,
                    fontSize: "11px",
                    color: isOverdue ? "#ff6b6b" : isSoon ? "rgba(255,200,80,1)" : t.textTertiary,
                    minWidth: "90px",
                    textAlign: "right" as const,
                  })}
                >
                  {dleft === null
                    ? "No due date"
                    : isOverdue
                    ? `${Math.abs(dleft)}d overdue`
                    : dleft === 0
                    ? "Due today"
                    : `${dleft}d left`}
                </span>
                <span style={f({ fontWeight: 700, fontSize: "13px", color: t.text, minWidth: "70px", textAlign: "right" as const })}>
                  {p.budget ? fmtUsd(p.budget, { compact: true }) : "—"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── Production schedule (kept) ─────────────────────────

function ProjectGantt({ project, phases }: { project: Project; phases: Phase[] }) {
  const { t } = useTheme();
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const sortedPhases = phases
    .filter((p) => p.startDate && p.endDate)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedPhases.length === 0) return null;

  const earliest = dayStart(new Date(Math.min(...sortedPhases.map((p) => new Date(p.startDate!).getTime()))));
  const latestInclusive = dayStart(new Date(Math.max(...sortedPhases.map((p) => new Date(p.endDate!).getTime()))));
  const latestExcl = addDays(latestInclusive, 1);

  const startWeek = dayStart(earliest);
  startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const endWeek = addDays(latestExcl, 6 - latestExcl.getDay() + 1);
  const span = endWeek.getTime() - startWeek.getTime();
  const totalWeeks = Math.round(span / (7 * 86400000));

  const weeks: Date[] = [];
  for (let i = 0; i < totalWeeks; i++) weeks.push(addDays(startWeek, i * 7));

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
            <div key={i} style={{ position: "absolute", left: `${m.startPct}%`, width: `${m.widthPct}%`, top: 0, height: "100%", display: "flex", alignItems: "center", borderLeft: i > 0 ? `1px solid ${t.borderSubtle}` : "none", paddingLeft: "4px" }}>
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
            return <div key={i} style={{ position: "absolute", left: `${pct}%`, top: "-2px", width: "1px", height: "5px", background: t.borderSubtle }} />;
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
              <div style={{ position: "absolute", left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%`, top: "2px", height: "16px", borderRadius: "3px", background: bgColor, overflow: "hidden" }}>
                <div style={{ width: `${fillPct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        );
      })}

      {showToday && (
        <div style={{ display: "flex", marginTop: "-4px" }}>
          <div style={{ width: `${labelWidth}px`, flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative", height: "0" }}>
            <div style={{ position: "absolute", left: `${todayOffset}%`, top: `-${sortedPhases.length * 32 + 21}px`, width: "1.5px", height: `${sortedPhases.length * 32 + 21}px`, background: "rgba(255,90,90,0.6)", zIndex: 2, pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: `calc(${todayOffset}% - 16px)`, top: "2px" }}>
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
        api
          .getProjectPhases(p.id)
          .then((phases) => {
            setPhasesMap((prev) => ({ ...prev, [p.id]: phases }));
          })
          .catch(() => {});
      }
    });
  }, [projectIds]);

  if (nonArchived.length === 0) return null;

  return (
    <div style={{ marginTop: "8px" }}>
      <h2 style={f({ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: t.textMuted, marginBottom: "14px" })}>
        Production schedule
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
                  borderBottom: i < nonArchived.length - 1 || isExpanded ? `1px solid ${t.borderSubtle}` : "none",
                  gap: "12px",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.5" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={f({ fontWeight: 700, fontSize: "13px", color: t.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
                    {project.name}
                  </p>
                </div>
                {currentPhaseName && (
                  <span style={f({ fontWeight: 500, fontSize: "10px", color: t.textMuted, background: t.hoverBg, padding: "3px 10px", borderRadius: "4px", whiteSpace: "nowrap" })}>
                    {currentPhaseName}
                  </span>
                )}
                <div style={{ width: "60px", textAlign: "right" }}>
                  <span style={f({ fontWeight: 700, fontSize: "13px", color: t.text })}>{project.progress}%</span>
                </div>
                <div style={{ width: "80px", height: "4px", background: t.borderSubtle, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${project.progress}%`, height: "100%", background: project.progress === 100 ? t.accent : "rgba(120,180,255,0.7)", borderRadius: "2px", transition: "width 0.3s" }} />
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

// ───────────────────────── Page ─────────────────────────

export default function TeamDashboard() {
  const { t } = useTheme();
  const { currentUser, isLoading: authLoading, userId } = useTeamAuth();
  const { projects, isLoading, isError, refetch } = useDashboardData();
  const { data: invoicesData, isLoading: invoicesLoading } = useListInvoices({
    query: { enabled: !!userId },
  });
  const f = (s: object) => ({ fontFamily: "'Montserrat', sans-serif" as const, ...s });

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const rev = useMemo(() => computeRevenue(invoicesData ?? []), [invoicesData]);

  if (authLoading || isLoading) {
    return (
      <TeamLayout>
        <DashboardSkeleton />
      </TeamLayout>
    );
  }

  if (isError) {
    return (
      <TeamLayout>
        <div style={{ padding: "80px 48px" }}>
          <ErrorState message="We couldn't load your dashboard data. Please check your connection and try again." onRetry={refetch} />
        </div>
      </TeamLayout>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <TeamLayout>
      <div style={{ padding: "32px 48px", maxWidth: "1280px" }}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={f({ fontWeight: 400, fontSize: "12px", color: t.textMuted, marginBottom: "4px" })}>
              {today}
            </p>
            <h1 style={f({ fontWeight: 800, fontSize: "26px", color: t.text })}>
              {currentUser?.name?.split(" ")[0] ?? "Team"} — what needs you today
            </h1>
          </div>
          {invoicesLoading && (
            <p style={f({ fontWeight: 500, fontSize: "11px", color: t.textTertiary })}>
              Updating revenue…
            </p>
          )}
        </div>

        <TodayBar projects={projects} rev={rev} />
        <RevenuePanel rev={rev} />
        <PlannedInvoicesPanel rev={rev} projectMap={projectMap} />
        <NeedsAttentionPanel projects={projects} />
        <ScheduleSection projects={projects} />
      </div>
    </TeamLayout>
  );
}
