"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ─── Types & constants (local copies) ───────────────────── */

interface LogEntry {
  id: string;
  log_date: string;
  leg_pain: number;
  lower_back_pain: number;
  chest_pain: number;
  shoulder_pain: number;
  headache: number;
  pelvic_pain: number;
  bowel_urination_pain: number;
  intercourse_pain: number;
  bloating: number;
  nausea: number;
  diarrhea: number;
  constipation: number;
  fatigue: number;
  inflammation: number;
  mood: number;
  stress: number;
  inactivity: number;
  overexertion: number;
  coffee: number;
  alcohol: number;
  smoking: number;
  diet: number;
  sleep: number;
  cycle_phase: string | null;
  notes: string | null;
}

const numericKeys = [
  "leg_pain","lower_back_pain","chest_pain","shoulder_pain","headache",
  "pelvic_pain","bowel_urination_pain","intercourse_pain","bloating","nausea",
  "diarrhea","constipation","fatigue","inflammation","mood","stress",
  "inactivity","overexertion","coffee","alcohol","smoking","diet","sleep",
] as const;

const symptomLabels: Record<string, string> = {
  leg_pain: "Leg Pain",
  lower_back_pain: "Lower Back Pain",
  chest_pain: "Chest Pain",
  shoulder_pain: "Shoulder Pain",
  headache: "Headache",
  pelvic_pain: "Pelvic Pain",
  bowel_urination_pain: "Bowel/Urination Pain",
  intercourse_pain: "Intercourse Pain",
  bloating: "Bloating",
  nausea: "Nausea",
  diarrhea: "Diarrhea",
  constipation: "Constipation",
  fatigue: "Fatigue",
  inflammation: "Inflammation",
  mood: "Mood",
  stress: "Stress",
  inactivity: "Inactivity",
  overexertion: "Overexertion",
  coffee: "Coffee",
  alcohol: "Alcohol",
  smoking: "Smoking",
  diet: "Diet",
  sleep: "Sleep",
};

const T10 = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
];

function getHeatColor(value: number): string {
  if (value === 0 || value == null) return "rgba(214, 208, 200, 0.12)";
  if (value <= 1) return "#c7e3be";
  if (value <= 2) return "#a1d29a";
  if (value <= 3) return "#7bbf6e";
  if (value <= 4) return "#f0dc6e";
  if (value <= 5) return "#f0b84a";
  if (value <= 6) return "#eb9a3e";
  if (value <= 7) return "#e67c3a";
  if (value <= 8) return "#dc5840";
  if (value <= 9) return "#c43a31";
  return "#a61c00";
}

/* ─── Helpers ────────────────────────────────────────────── */

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/* ─── Tooltip (matches history page style) ───────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SummaryTooltip(props: any) {
  const { active, payload, label, colorMap = {} } = props;
  if (!active || !payload?.length) return null;

  const nonZero = payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => (p.value ?? 0) > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

  if (nonZero.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-border bg-surface px-3 py-2.5 text-xs shadow-lg animate-tooltip-in"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", pointerEvents: "none" }}
    >
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {nonZero.map((entry: any) => {
          const color = colorMap[entry.dataKey] || entry.stroke || entry.color || "#999";
          const value = entry.value as number;
          const pct = Math.min((value / 10) * 100, 100);
          const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);

          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: color }}
              />
              <span className="w-28 truncate text-muted">{entry.name}</span>
              <div
                className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(168, 162, 158, 0.18)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-foreground">
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Trend arrow SVGs ───────────────────────────────────── */

function ArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M7 2l3.5 3.5M7 2L3.5 5.5" stroke="#e15759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 12V2M7 12l3.5-3.5M7 12L3.5 8.5" stroke="#59a14f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dash() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function SummaryPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const cutoff = fmtDate(sixtyDaysAgo);

      const { data } = await supabase
        .from("symptom_logs")
        .select("*")
        .gte("log_date", cutoff)
        .order("log_date", { ascending: true });

      setEntries(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => fmtDate(today), [today]);

  /* Split into current 30 days and previous 30 days */
  const { current30, previous30, last7 } = useMemo(() => {
    const thirtyAgo = new Date(today);
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const thirtyStr = fmtDate(thirtyAgo);

    const sixtyAgo = new Date(today);
    sixtyAgo.setDate(sixtyAgo.getDate() - 60);
    const sixtyStr = fmtDate(sixtyAgo);

    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 7);
    const sevenStr = fmtDate(sevenAgo);

    return {
      current30: entries.filter((e) => e.log_date > thirtyStr && e.log_date <= todayStr),
      previous30: entries.filter((e) => e.log_date > sixtyStr && e.log_date <= thirtyStr),
      last7: entries.filter((e) => e.log_date > sevenStr && e.log_date <= todayStr),
    };
  }, [entries, today, todayStr]);

  /* ── Section 1: Quick Stats ── */
  const stats = useMemo(() => {
    const entriesThisMonth = current30.length;

    // Logging streak: consecutive days ending today or yesterday
    let streak = 0;
    if (entriesThisMonth > 0) {
      const logDates = new Set(current30.map((e) => e.log_date));
      const check = new Date(today);
      // Allow starting from yesterday if no log today
      if (!logDates.has(fmtDate(check))) {
        check.setDate(check.getDate() - 1);
      }
      while (logDates.has(fmtDate(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }

    // Last logged
    let lastLoggedLabel = "—";
    if (entries.length > 0) {
      const lastDate = entries[entries.length - 1].log_date;
      const diff = daysBetween(new Date(lastDate + "T00:00:00"), today);
      if (diff <= 0) lastLoggedLabel = "Today";
      else if (diff === 1) lastLoggedLabel = "1 day ago";
      else lastLoggedLabel = `${diff} days ago`;
    }

    // Avg severity (mean of all non-zero symptoms over last 30 days)
    let avgSeverity = 0;
    if (current30.length > 0) {
      let sum = 0;
      let count = 0;
      for (const entry of current30) {
        for (const key of numericKeys) {
          const val = entry[key] as number;
          if (val > 0) {
            sum += val;
            count++;
          }
        }
      }
      avgSeverity = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    }

    return { entriesThisMonth, streak, lastLoggedLabel, avgSeverity };
  }, [current30, entries, today]);

  /* ── Section 2: Top 5 most active symptoms (7-day chart) ── */
  const { chartData, chartLines, chartColorMap } = useMemo(() => {
    if (last7.length === 0) return { chartData: [], chartLines: [], chartColorMap: {} };

    // Find top 5 symptoms by total value in last 7 days
    const totals: Record<string, number> = {};
    for (const key of numericKeys) totals[key] = 0;
    for (const entry of last7) {
      for (const key of numericKeys) {
        totals[key] += entry[key] as number;
      }
    }
    const top5Keys = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .filter(([, v]) => v > 0)
      .map(([k]) => k);

    const lines = top5Keys.map((key, i) => ({
      key,
      label: symptomLabels[key] || key,
      color: T10[i],
    }));

    const colorMap: Record<string, string> = {};
    lines.forEach((l) => { colorMap[l.key] = l.color; });

    // Build chart rows — one per day in the last 7 days
    const rows: { label: string; [k: string]: number | string }[] = [];
    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 6); // 7 days including today

    const entryMap = new Map<string, LogEntry>();
    for (const e of last7) entryMap.set(e.log_date, e);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenAgo);
      d.setDate(d.getDate() + i);
      const dateStr = fmtDate(d);
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
      const entry = entryMap.get(dateStr);
      const row: { label: string; [k: string]: number | string } = { label: dayLabel };
      for (const key of top5Keys) {
        row[key] = entry ? (entry[key as keyof LogEntry] as number) : 0;
      }
      rows.push(row);
    }

    return { chartData: rows, chartLines: lines, chartColorMap: colorMap };
  }, [last7, today]);

  /* ── Section 3: Top symptoms with trend arrows ── */
  const topSymptomTrends = useMemo(() => {
    if (current30.length === 0) return [];

    // Current 30-day averages
    const currentAvgs: Record<string, number> = {};
    for (const key of numericKeys) {
      let sum = 0;
      for (const entry of current30) sum += entry[key] as number;
      currentAvgs[key] = sum / current30.length;
    }

    // Previous 30-day averages
    const prevAvgs: Record<string, number> = {};
    for (const key of numericKeys) {
      if (previous30.length === 0) {
        prevAvgs[key] = 0;
      } else {
        let sum = 0;
        for (const entry of previous30) sum += entry[key] as number;
        prevAvgs[key] = sum / previous30.length;
      }
    }

    return Object.entries(currentAvgs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .filter(([, v]) => v > 0)
      .map(([key, avg]) => {
        const diff = avg - prevAvgs[key];
        let trend: "up" | "down" | "stable" = "stable";
        if (diff > 0.3) trend = "up";
        else if (diff < -0.3) trend = "down";
        return {
          key,
          label: symptomLabels[key] || key,
          avg: Math.round(avg * 10) / 10,
          trend,
        };
      });
  }, [current30, previous30]);

  /* ── Section 4: Weekly overview strip ── */
  const weeklyStrip = useMemo(() => {
    const days: { label: string; avg: number; hasData: boolean }[] = [];
    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 6);

    const entryMap = new Map<string, LogEntry>();
    for (const e of last7) entryMap.set(e.log_date, e);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenAgo);
      d.setDate(d.getDate() + i);
      const dateStr = fmtDate(d);
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
      const entry = entryMap.get(dateStr);

      if (entry) {
        let sum = 0;
        let count = 0;
        for (const key of numericKeys) {
          const val = entry[key] as number;
          if (val > 0) { sum += val; count++; }
        }
        days.push({ label: dayLabel, avg: count > 0 ? Math.round((sum / count) * 10) / 10 : 0, hasData: true });
      } else {
        days.push({ label: dayLabel, avg: 0, hasData: false });
      }
    }

    return days;
  }, [last7, today]);

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-screen justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <h1 className="mb-8 font-serif text-2xl font-semibold tracking-tight text-foreground">Summary</h1>
          <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
            <h2 className="font-serif text-lg font-semibold text-foreground">No entries yet</h2>
            <p className="text-sm text-muted">
              Once you start logging symptoms, your summary and trends will appear here.
            </p>
            <a
              href="/dashboard/log"
              className="inline-block rounded-md bg-accent-green px-6 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Log your first entry
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-2xl space-y-8 px-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Summary</h1>

        {/* ── Section 1: Quick Stats ── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { value: stats.entriesThisMonth, label: "Entries this month" },
            { value: `${stats.streak}d`, label: "Logging streak" },
            { value: stats.lastLoggedLabel, label: "Last logged" },
            { value: stats.avgSeverity, label: "Avg severity" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-md border border-border bg-surface px-4 py-4 text-center"
            >
              <p className="font-serif text-2xl font-semibold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Section 2: Recent Trends (7-Day Area Chart) ── */}
        {chartLines.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-center font-serif text-lg font-semibold tracking-tight text-muted">
              Recent Trends (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <defs>
                  {chartLines.map((line) => (
                    <linearGradient key={line.key} id={`summary-area-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.25)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={(props) => <SummaryTooltip {...props} colorMap={chartColorMap} />}
                  cursor={{ stroke: "#a8a29e", strokeDasharray: "4 4", strokeWidth: 1 }}
                  wrapperStyle={{ zIndex: 1000 }}
                  isAnimationActive={false}
                />
                {chartLines.map((line) => (
                  <Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color}
                    fill={`url(#summary-area-${line.key})`}
                    strokeWidth={2}
                    dot={{ r: 2, fill: line.color, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: line.color, strokeWidth: 3, fill: "#fff", strokeOpacity: 0.6 }}
                    animationDuration={800}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            {/* Inline legend */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs">
              {chartLines.map((line) => (
                <div key={line.key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-[3px]"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-foreground">{line.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 3: Top Symptoms with Trend Arrows ── */}
        {topSymptomTrends.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">
              Top Symptoms
            </h2>
            <div className="space-y-3">
              {topSymptomTrends.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-sm text-muted truncate">{item.label}</span>
                  <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                    {item.avg}/10
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent-green transition-all duration-500"
                      style={{ width: `${(item.avg / 10) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0" title={item.trend === "up" ? "Worsening" : item.trend === "down" ? "Improving" : "Stable"}>
                    {item.trend === "up" && <ArrowUp />}
                    {item.trend === "down" && <ArrowDown />}
                    {item.trend === "stable" && <Dash />}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Compared to previous 30 days — <span className="inline-flex items-center gap-0.5"><ArrowDown /> improving</span> · <span className="inline-flex items-center gap-0.5"><ArrowUp /> worsening</span> · <span className="inline-flex items-center gap-0.5"><Dash /> stable</span>
            </p>
          </div>
        )}

        {/* ── Section 4: Weekly Overview Strip ── */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">
            Weekly Overview
          </h2>
          <div className="flex justify-center gap-2">
            {weeklyStrip.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="rounded-md"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: day.hasData ? getHeatColor(day.avg) : "rgba(214, 208, 200, 0.12)",
                    border: day.hasData ? "none" : "1px dashed rgba(168, 162, 158, 0.4)",
                  }}
                />
                <span className="text-xs text-muted">{day.label}</span>
              </div>
            ))}
          </div>
          {/* Mini legend */}
          <div className="mt-3 flex items-center justify-center gap-0.5 text-xs text-muted">
            <span className="mr-1">0</span>
            {Array.from({ length: 11 }, (_, v) => (
              <div key={v} className="rounded-[3px]" style={{ width: 14, height: 14, backgroundColor: getHeatColor(v) }} />
            ))}
            <span className="ml-1">10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
