"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ─── Types & constants ────────────────────────────────── */

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
  bowel_pain: number;
  urination_pain: number;
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

const symptomLabels: Record<string, string> = {
  leg_pain: "Leg Pain",
  lower_back_pain: "Lower Back Pain",
  chest_pain: "Chest Pain",
  shoulder_pain: "Shoulder Pain",
  headache: "Headache",
  pelvic_pain: "Pelvic Pain",
  bowel_urination_pain: "Bowel/Urination Pain",
  bowel_pain: "Bowel Pain",
  urination_pain: "Urination Pain",
  intercourse_pain: "Intercourse Pain",
  bloating: "Bloating",
  nausea: "Nausea",
  diarrhea: "Diarrhea",
  constipation: "Constipation",
  fatigue: "Fatigue",
  inflammation: "Full Body Inflammation",
  mood: "Mood",
  stress: "Stress",
  inactivity: "Inactivity",
  overexertion: "Overexertion",
  coffee: "Caffeine",
  alcohol: "Alcohol",
  smoking: "Smoking",
  diet: "Diet",
  sleep: "Sleep Quality",
};

const cyclePhaseLabels: Record<string, string> = {
  menstrual: "Menstrual phase",
  follicular: "Follicular phase",
  ovulation: "Ovulation",
  luteal: "Luteal phase",
  on_pill: "On the pill",
  on_hormonal_treatment: "On Hormonal Treatment",
};

function formatCyclePhase(phase: string): string {
  if (phase.startsWith("other:")) return phase.slice(6);
  return cyclePhaseLabels[phase] ?? phase;
}

const numericKeys = [
  "pelvic_pain","lower_back_pain","leg_pain","chest_pain","shoulder_pain","headache",
  "bowel_urination_pain","bowel_pain","urination_pain","intercourse_pain","bloating","nausea",
  "diarrhea","constipation","fatigue","inflammation","mood","stress",
  "inactivity","overexertion","coffee","alcohol","smoking","diet","sleep",
] as const;

/* ─── Tableau 10 palette ──────────────────────────────── */

const T10 = [
  "#92A8C8", "#E4B5B5", "#C4685A", "#D4836E", "#E0CBA8",
  "#A8C49A", "#8DAE7E", "#B09AD4", "#D8AD82", "#E0C878",
];

const painLines = [
  { key: "pelvic_pain", label: "Pelvic", color: T10[0] },
  { key: "lower_back_pain", label: "Lower Back", color: T10[1] },
  { key: "leg_pain", label: "Leg", color: T10[2] },
  { key: "headache", label: "Headache", color: T10[3] },
  { key: "chest_pain", label: "Chest", color: T10[4] },
  { key: "shoulder_pain", label: "Shoulder", color: T10[5] },
  { key: "bowel_pain", label: "Bowel", color: T10[6] },
  { key: "urination_pain", label: "Urination", color: T10[7] },
  { key: "intercourse_pain", label: "Intercourse", color: T10[8] },
];

const otherLines = [
  { key: "bloating", label: "Bloating", color: T10[0] },
  { key: "nausea", label: "Nausea", color: T10[1] },
  { key: "diarrhea", label: "Diarrhea", color: T10[2] },
  { key: "constipation", label: "Constipation", color: T10[3] },
  { key: "fatigue", label: "Fatigue", color: T10[4] },
  { key: "inflammation", label: "Full Body Inflammation", color: T10[5] },
  { key: "mood", label: "Mood", color: T10[6] },
];

const lifestyleLines = [
  { key: "stress", label: "Stress", color: T10[0] },
  { key: "inactivity", label: "Inactivity", color: T10[1] },
  { key: "overexertion", label: "Overexertion", color: T10[2] },
  { key: "coffee", label: "Caffeine", color: T10[3] },
  { key: "alcohol", label: "Alcohol", color: T10[4] },
  { key: "smoking", label: "Smoking", color: T10[5] },
  { key: "diet", label: "Diet", color: T10[6] },
  { key: "sleep", label: "Sleep Quality", color: T10[7] },
];

const seriesColorMap: Record<string, string> = {};
[painLines, otherLines, lifestyleLines].forEach((group) =>
  group.forEach((l) => { seriesColorMap[l.key] = l.color; }),
);

const heatmapGroups = [
  {
    label: "Pain",
    keys: ["pelvic_pain", "lower_back_pain", "leg_pain", "headache", "chest_pain", "shoulder_pain", "bowel_pain", "urination_pain", "intercourse_pain"],
  },
  {
    label: "Other Symptoms",
    keys: ["bloating", "nausea", "diarrhea", "constipation", "fatigue", "inflammation", "mood"],
  },
  {
    label: "Lifestyle Triggers",
    keys: ["stress", "inactivity", "overexertion", "coffee", "alcohol", "smoking", "diet", "sleep"],
  },
];

function getHeatColor(value: number): string {
  if (value === 0 || value == null) return "rgba(214, 208, 200, 0.12)";
  if (value <= 1) return "rgba(184, 148, 63, 0.2)";
  if (value <= 2) return "rgba(184, 148, 63, 0.35)";
  if (value <= 3) return "rgba(184, 148, 63, 0.55)";
  if (value <= 4) return "rgba(212, 180, 101, 0.65)";
  if (value <= 5) return "rgba(184, 120, 88, 0.5)";
  if (value <= 6) return "rgba(184, 120, 88, 0.6)";
  if (value <= 7) return "rgba(184, 120, 88, 0.7)";
  if (value <= 8) return "rgba(184, 120, 88, 0.8)";
  if (value <= 9) return "rgba(184, 120, 88, 0.9)";
  return "rgba(184, 120, 88, 1)";
}

type TimeRange = "7d" | "30d" | "90d" | "1y" | "All" | "Custom";
type ChartRow = { label: string; [k: string]: number | string };

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "1y", label: "1y" },
  { value: "All", label: "All" },
  { value: "Custom", label: "Custom" },
];

/* ─── Date utilities ───────────────────────────────────── */

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString("en", { month: "short" });
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getRange(ref: Date, range: TimeRange, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  switch (range) {
    case "7d":
      return { start: addDays(ref, -6), end: ref };
    case "30d":
      return { start: addDays(ref, -29), end: ref };
    case "90d":
      return { start: addDays(ref, -89), end: ref };
    case "1y":
      return {
        start: new Date(ref.getFullYear() - 1, ref.getMonth(), ref.getDate()),
        end: ref,
      };
    case "All":
      return {
        start: new Date(2000, 0, 1),
        end: new Date(2099, 11, 31),
      };
    case "Custom":
      return {
        start: customStart ?? addDays(ref, -29),
        end: customEnd ?? ref,
      };
  }
}

function getRangeLabel(ref: Date, range: TimeRange, customStart?: Date, customEnd?: Date): string {
  const { start, end } = getRange(ref, range, customStart, customEnd);
  switch (range) {
    case "7d":
    case "30d":
    case "90d":
      return `${fmtShort(start)} – ${fmtShort(end)}`;
    case "1y":
      return `${fmtShort(start)} – ${fmtShort(end)}`;
    case "All":
      return "All time";
    case "Custom":
      return `${fmtShort(start)} – ${fmtShort(end)}`;
  }
}

/* ─── Data aggregation ─────────────────────────────────── */

function aggregateEntries(
  entries: LogEntry[],
  range: TimeRange,
  ref: Date,
  cStart?: Date,
  cEnd?: Date,
): ChartRow[] {
  const { start, end } = getRange(ref, range, cStart, cEnd);
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);

  const filtered = entries.filter(
    (e) => e.log_date >= startStr && e.log_date <= endStr,
  );

  const days = daysBetween(start, end);

  // Short ranges (up to 30 days): show individual days
  if (days <= 30) {
    return filtered.map((e) => {
      const d = new Date(e.log_date + "T00:00:00");
      const row: ChartRow = { label: fmtShort(d) };
      for (const k of numericKeys) row[k] = e[k];
      return row;
    });
  }

  // Medium ranges (31-180 days): aggregate by week
  if (days <= 180) {
    const weekBuckets: Record<string, { sum: Record<string, number>; count: number; sortKey: string }> = {};
    for (const e of filtered) {
      const d = new Date(e.log_date + "T00:00:00");
      const ws = startOfWeek(d);
      const weekKey = fmtDate(ws);
      if (!weekBuckets[weekKey]) {
        weekBuckets[weekKey] = { sum: Object.fromEntries(numericKeys.map((k) => [k, 0])), count: 0, sortKey: weekKey };
      }
      weekBuckets[weekKey].count++;
      for (const k of numericKeys) weekBuckets[weekKey].sum[k] += e[k];
    }

    return Object.values(weekBuckets)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((b) => {
        const ws = new Date(b.sortKey + "T00:00:00");
        const row: ChartRow = { label: fmtShort(ws) };
        for (const k of numericKeys) row[k] = Math.round((b.sum[k] / b.count) * 10) / 10;
        return row;
      });
  }

  // Long ranges (180+ days): aggregate by month
  const buckets: Record<string, { sum: Record<string, number>; count: number; sortKey: string }> = {};
  for (const e of filtered) {
    const d = new Date(e.log_date + "T00:00:00");
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets[monthKey]) {
      buckets[monthKey] = { sum: Object.fromEntries(numericKeys.map((k) => [k, 0])), count: 0, sortKey: monthKey };
    }
    buckets[monthKey].count++;
    for (const k of numericKeys) buckets[monthKey].sum[k] += e[k];
  }

  return Object.values(buckets)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((b) => {
      const d = new Date(b.sortKey + "-01T00:00:00");
      const row: ChartRow = { label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }) };
      for (const k of numericKeys) row[k] = Math.round((b.sum[k] / b.count) * 10) / 10;
      return row;
    });
}

/* ─── Trend arrow SVGs ─────────────────────────────────── */

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

/* ─── Empty state SVG ──────────────────────────────────── */

function EmptyChartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-2 text-muted">
      <rect x="6" y="30" width="6" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="16" y="22" width="6" height="20" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="26" y="14" width="6" height="28" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="36" y="18" width="6" height="24" rx="2" fill="currentColor" opacity="0.3" />
      <line x1="4" y1="44" x2="44" y2="44" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

/* ─── Modern tooltip ───────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ModernTooltip(props: any) {
  const { active, payload, label, colorMap = {}, theme = "dark" } = props;
  if (!active || !payload?.length) return null;
  const tc = theme === "dark"
    ? { card: "rounded-xl border border-white/10 bg-foreground", label: "text-surface", text: "text-surface/60", value: "text-surface" }
    : { card: "rounded-xl border border-border bg-surface", label: "text-foreground", text: "text-muted", value: "text-foreground" };

  const nonZero = payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => (p.value ?? 0) > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

  if (nonZero.length === 0) return null;

  return (
    <div
      className={`${tc.card} px-3 py-2.5 text-xs shadow-lg animate-tooltip-in`}
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", pointerEvents: "none" }}
    >
      <p className={`mb-1.5 font-semibold ${tc.label}`}>{label}</p>
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
              <span className={`w-28 truncate ${tc.text}`}>{entry.name}</span>
              <div
                className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(168, 162, 158, 0.18)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className={`w-6 shrink-0 text-right font-semibold tabular-nums ${tc.value}`}>
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Interactive legend ───────────────────────────────── */

function InteractiveLegend({
  items,
  hiddenSeries,
  highlightedSeries,
  onToggle,
  onHighlight,
  theme = "dark",
}: {
  items: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  highlightedSeries: string | null;
  onToggle: (key: string) => void;
  onHighlight: (key: string | null) => void;
  theme?: CardTheme;
}) {
  const legendColor = theme === "dark" ? "text-surface/70" : "text-foreground";
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pl-[40px] text-xs">
      {items.map((item) => {
        const hidden = hiddenSeries.has(item.key);
        const isHighlighting = highlightedSeries !== null;
        const isDimmed = isHighlighting && highlightedSeries !== item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            onMouseEnter={() => onHighlight(item.key)}
            onMouseLeave={() => onHighlight(null)}
            className="flex cursor-pointer items-center gap-1.5 transition-opacity duration-150"
            style={{ opacity: hidden ? 0.35 : isDimmed ? 0.35 : 1 }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: hidden ? "#a8a29e" : item.color }}
            />
            <span
              className={legendColor}
              style={{ textDecoration: hidden ? "line-through" : "none" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Area chart component ─────────────────────────────── */

function SymptomAreaChart({
  title,
  data,
  lines,
  hiddenSeries,
  onToggleSeries,
  theme = "dark",
}: {
  title: string;
  data: LogEntry[];
  lines: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  onToggleSeries: (key: string) => void;
  theme?: CardTheme;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const visibleLines = lines.filter((l) => !hiddenSeries.has(l.key));
  const colorMap = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.key, l.color])),
    [lines],
  );
  const ct = useCardColors(theme);

  return (
    <div className={`${ct.card} space-y-2`}>
      {ct.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
      <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${ct.label}`}>
        Weekly Overview
      </p>
      <h2 className={`relative font-serif text-lg ${ct.title}`}>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.key} id={`area-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
          <XAxis dataKey="log_date" tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <ModernTooltip {...props} colorMap={colorMap} theme={theme} />}
            cursor={{ stroke: ct.cursor, strokeDasharray: "4 4", strokeWidth: 1 }}
            wrapperStyle={{ zIndex: 1000 }}
            isAnimationActive={false}
          />
          {visibleLines.map((line) => (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              fill={`url(#area-${line.key})`}
              strokeWidth={2}
              dot={{ r: 2.5, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: line.color, strokeWidth: 3, fill: "#fff", strokeOpacity: 0.6 }}
              fillOpacity={highlighted && highlighted !== line.key ? 0.15 : 1}
              strokeOpacity={highlighted && highlighted !== line.key ? 0.15 : 1}
              animationDuration={800}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <InteractiveLegend
        items={lines}
        hiddenSeries={hiddenSeries}
        highlightedSeries={highlighted}
        onToggle={onToggleSeries}
        onHighlight={setHighlighted}
        theme={theme}
      />
    </div>
  );
}

/* ─── Bar chart component ──────────────────────────────── */

function SymptomBarChart({
  title,
  data,
  lines,
  hiddenSeries,
  onToggleSeries,
  theme = "dark",
}: {
  title: string;
  data: ChartRow[];
  lines: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  onToggleSeries: (key: string) => void;
  theme?: CardTheme;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const visibleLines = lines.filter((l) => !hiddenSeries.has(l.key));
  const colorMap = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.key, l.color])),
    [lines],
  );
  const ct = useCardColors(theme);

  if (data.length === 0) {
    return (
      <div className={`${ct.card} space-y-2`}>
        {ct.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
        <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${ct.label}`}>Breakdown</p>
        <h2 className={`relative font-serif text-lg ${ct.title}`}>{title}</h2>
        <div className="py-8 text-center">
          <EmptyChartIcon />
          <p className={`text-sm ${ct.emptyText}`}>No data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ct.card} space-y-2`}>
      {ct.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
      <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${ct.label}`}>
        Breakdown
      </p>
      <h2 className={`relative font-serif text-lg ${ct.title}`}>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={1} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: ct.axis }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <ModernTooltip {...props} colorMap={colorMap} theme={theme} />}
            cursor={{ fill: ct.barCursor }}
            wrapperStyle={{ zIndex: 1000 }}
            isAnimationActive={false}
          />
          {visibleLines.map((line, idx) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              name={line.label}
              stackId="stack"
              fill={`url(#grad-${line.key})`}
              radius={idx === visibleLines.length - 1 ? [4, 4, 0, 0] : undefined}
              opacity={highlighted && highlighted !== line.key ? 0.15 : 1}
              activeBar={{ stroke: line.color, strokeWidth: 2 }}
              animationDuration={800}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <InteractiveLegend
        items={lines}
        hiddenSeries={hiddenSeries}
        highlightedSeries={highlighted}
        onToggle={onToggleSeries}
        onHighlight={setHighlighted}
        theme={theme}
      />
    </div>
  );
}

/* ─── Cycle phase colors ──────────────────────────────── */

const cyclePhaseColors: Record<string, string> = {
  menstrual: "#C4685A",
  follicular: "#E4B5B5",
  ovulation: "#E0C878",
  luteal: "#92A8C8",
  on_pill: "#B09AD4",
  on_hormonal_treatment: "#B09AD4",
};

function getCycleColor(phase: string | null): string | null {
  if (!phase) return null;
  for (const [key, color] of Object.entries(cyclePhaseColors)) {
    if (phase.includes(key)) return color;
  }
  return null;
}

/* ─── Monthly Heatmap ─────────────────────────────────── */

type HeatmapCategory = "Pain" | "Other Symptoms" | "Lifestyle Triggers" | "All";

function DailyHeatmap({ entries, theme = "dark" }: { entries: LogEntry[]; theme?: CardTheme }) {
  const ct = useCardColors(theme);
  const [category, setCategory] = useState<HeatmapCategory>("All");
  const [hoveredCell, setHoveredCell] = useState<{
    row: string; col: number; value: number; dateStr: string; x: number; y: number;
  } | null>(null);

  // Build date list from entries (already filtered by time range)
  const dates = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.log_date.localeCompare(b.log_date));
    return sorted.map((e) => e.log_date);
  }, [entries]);

  const entryMap = useMemo(() => {
    const map: Record<string, LogEntry> = {};
    for (const e of entries) map[e.log_date] = e;
    return map;
  }, [entries]);

  const visibleKeys = useMemo(() => {
    const group = heatmapGroups.find((g) => g.label === category);
    if (group) return group.keys;
    return heatmapGroups.flatMap((g) => g.keys);
  }, [category]);

  if (dates.length === 0) {
    return (
      <div className={ct.card}>
        {ct.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
        <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${ct.label}`}>Your Activity</p>
        <h2 className={`relative mt-1 font-serif text-lg ${ct.title}`}>Heatmap</h2>
        <div className="py-8 text-center">
          <EmptyChartIcon />
          <p className={`text-sm ${ct.emptyText}`}>No data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ct.card}>
      {ct.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
      {/* Header */}
      <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-[0.12em] ${ct.label}`}>Your Activity</p>
          <h2 className={`mt-1 font-serif text-lg ${ct.title}`}>Heatmap</h2>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as HeatmapCategory)}
          className={ct.selectClass}
        >
          <option value="All">All</option>
          <option value="Pain">Pain</option>
          <option value="Other Symptoms">Other Symptoms</option>
          <option value="Lifestyle Triggers">Lifestyle Triggers</option>
        </select>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={`sticky left-0 z-10 ${ct.stickyBg} pr-2 text-left font-medium ${ct.label}`} style={{ minWidth: 110 }} />
              {dates.map((d, i) => {
                const date = new Date(d + "T00:00:00");
                return (
                  <th key={i} className={`px-0.5 pb-1 text-center font-medium ${ct.label}`} style={{ minWidth: 28 }}>
                    <div>{date.getDate()}</div>
                    <div className="text-[9px] opacity-60">{date.toLocaleDateString("en", { month: "short" })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Cycle phase row */}
            <tr>
              <td className={`sticky left-0 z-10 ${ct.stickyBg} pr-2 py-0.5 text-left font-medium text-accent-green`} style={{ minWidth: 110 }}>
                Cycle Phase
              </td>
              {dates.map((d, i) => {
                const entry = entryMap[d];
                const color = entry ? getCycleColor(entry.cycle_phase) : null;
                return (
                  <td key={i} className="px-0.5 py-0.5">
                    <div
                      className="mx-auto rounded-[4px]"
                      style={{
                        width: 24, height: 24,
                        backgroundColor: color || "rgba(214, 208, 200, 0.12)",
                        border: color ? "none" : "1px dashed rgba(168, 162, 158, 0.3)",
                      }}
                      title={entry?.cycle_phase ? entry.cycle_phase.split(",").map((p: string) => cyclePhaseLabels[p.trim()] || p.trim()).join(", ") : "No data"}
                    />
                  </td>
                );
              })}
            </tr>

            <tr><td colSpan={dates.length + 1} className="h-2" /></tr>

            {/* Symptom rows */}
            {visibleKeys.map((key) => (
              <tr key={key}>
                <td className={`sticky left-0 z-10 ${ct.stickyBg} pr-2 py-0.5 text-left ${ct.text}`} style={{ minWidth: 110 }}>
                  {symptomLabels[key] || key}
                </td>
                {dates.map((d, colIdx) => {
                  const entry = entryMap[d];
                  const val = entry ? ((entry[key as keyof LogEntry] as number) ?? 0) : 0;
                  const isHovered = hoveredCell?.row === key && hoveredCell?.col === colIdx;

                  return (
                    <td
                      key={colIdx}
                      className="px-0.5 py-0.5"
                      onMouseEnter={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setHoveredCell({ row: key, col: colIdx, value: val, dateStr: d, x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className="mx-auto"
                        style={{
                          width: 24, height: 24, borderRadius: 4,
                          backgroundColor: getHeatColor(val),
                          transform: isHovered ? "scale(1.3)" : "scale(1)",
                          boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          position: "relative",
                          zIndex: isHovered ? 10 : 1,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className={`pointer-events-none fixed z-50 ${ct.tooltipCard}`}
          style={{ left: hoveredCell.x, top: hoveredCell.y - 52, transform: "translateX(-50%)" }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[3px]" style={{ backgroundColor: getHeatColor(hoveredCell.value) }} />
            <span className={`font-semibold ${ct.tooltipLabel}`}>{symptomLabels[hoveredCell.row] || hoveredCell.row}</span>
          </div>
          <div className={`mt-0.5 ${ct.tooltipText}`}>
            {hoveredCell.dateStr} · <span className={`font-semibold ${ct.tooltipValue}`}>{hoveredCell.value}/10</span>
          </div>
        </div>
      )}

      {/* Legends */}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className={`flex items-center gap-0.5 text-xs ${ct.heatLegend}`}>
          <span className="mr-1">Severity: 0</span>
          {Array.from({ length: 11 }, (_, v) => (
            <div key={v} className="rounded-[3px]" style={{ width: 12, height: 12, backgroundColor: getHeatColor(v) }} />
          ))}
          <span className="ml-1">10</span>
        </div>
        <div className={`flex flex-wrap items-center gap-2 text-xs ${ct.heatLegend}`}>
          <span>Cycle:</span>
          {Object.entries(cyclePhaseColors).filter(([k]) => k !== "on_pill").map(([key, color]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
              {cyclePhaseLabels[key] || key}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Card theme ─────────────────────────────────────────── */

type CardTheme = "dark" | "light";

function useCardColors(theme: CardTheme) {
  if (theme === "dark") {
    return {
      card: "relative overflow-hidden rounded-3xl bg-foreground p-7",
      overlay: true,
      label: "text-surface/40",
      title: "text-surface/90",
      text: "text-surface/50",
      textStrong: "text-surface/90",
      legendText: "text-surface/70",
      grid: "rgba(255,255,255,0.06)",
      axis: "rgba(255,255,255,0.3)",
      cursor: "rgba(255,255,255,0.15)",
      barCursor: "rgba(255,255,255,0.05)",
      progressBg: "bg-white/[0.08]",
      statCard: "relative overflow-hidden rounded-2xl bg-foreground px-4 pt-4 pb-4 text-center",
      stickyBg: "bg-foreground",
      selectClass: "rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-surface/70 focus:border-accent-green focus:outline-none",
      heatLegend: "text-surface/40",
      tooltipCard: "rounded-xl border border-white/10 bg-foreground px-3 py-2.5 text-xs shadow-lg animate-tooltip-in",
      tooltipLabel: "text-surface",
      tooltipText: "text-surface/60",
      tooltipValue: "text-surface",
      emptyText: "text-surface/40",
    };
  }
  return {
    card: "rounded-2xl border border-border bg-surface p-6 shadow-sm card-hover",
    overlay: false,
    label: "text-muted",
    title: "text-foreground",
    text: "text-muted",
    textStrong: "text-foreground",
    legendText: "text-foreground",
    grid: "rgba(168,162,158,0.25)",
    axis: "#a8a29e",
    cursor: "#a8a29e",
    barCursor: "rgba(120,113,108,0.10)",
    progressBg: "bg-border",
    statCard: "card-hover flex flex-col rounded-2xl border border-border bg-surface px-4 pt-4 pb-4 text-center",
    stickyBg: "bg-surface",
    selectClass: "rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-accent-green focus:outline-none",
    heatLegend: "text-muted",
    tooltipCard: "rounded-xl border border-border bg-surface px-3 py-2.5 text-xs shadow-lg animate-tooltip-in",
    tooltipLabel: "text-foreground",
    tooltipText: "text-muted",
    tooltipValue: "text-foreground",
    emptyText: "text-muted",
  };
}

/* ─── Main Overview page ───────────────────────────────── */

export default function OverviewPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [refDate, setRefDate] = useState(() => new Date());
  const [customStart, setCustomStart] = useState(() => fmtDate(addDays(new Date(), -29)));
  const [customEnd, setCustomEnd] = useState(() => fmtDate(new Date()));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dailyLogsOpen, setDailyLogsOpen] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [cardTheme, setCardTheme] = useState<CardTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cardTheme") as CardTheme) || "dark";
    }
    return "dark";
  });
  const c = useCardColors(cardTheme);
  const [insights, setInsights] = useState<{
    triggerCorrelations: string;
    cyclePatterns: string;
    hormonalTreatment: string;
    trends: string;
    keyObservations: string;
    summary: string;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [profileHormonalTreatment, setProfileHormonalTreatment] = useState("");
  const [profileHormonalStartDate, setProfileHormonalStartDate] = useState("");

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* Single data fetch — all entries + profile hormonal treatment */
  useEffect(() => {
    async function load() {
      const [logsResult, profileResult] = await Promise.all([
        supabase.from("symptom_logs").select("*").order("log_date", { ascending: false }),
        supabase.from("profiles").select("hormonal_treatment, hormonal_treatment_start_date").maybeSingle(),
      ]);

      if (logsResult.error) {
        setError(logsResult.error.message);
      } else {
        setEntries(logsResult.data ?? []);
      }
      if (profileResult.data) {
        setProfileHormonalTreatment(profileResult.data.hormonal_treatment ?? "");
        setProfileHormonalStartDate(profileResult.data.hormonal_treatment_start_date ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => fmtDate(today), [today]);

  const chronological = useMemo(
    () => [...entries].sort((a, b) => a.log_date.localeCompare(b.log_date)),
    [entries],
  );

  /* ── Summary stats derived from full dataset ── */

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

  const stats = useMemo(() => {
    const entriesThisMonth = current30.length;

    // Average severity
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

    // Top recurring symptom (most days with value > 0)
    let topRecurringCount = 0;
    let topRecurringName = "\u2014";
    if (current30.length > 0) {
      const symptomKeys = numericKeys.filter((k) => !["inactivity", "overexertion", "coffee", "alcohol", "smoking", "diet", "sleep", "stress"].includes(k));
      const freq: Record<string, number> = {};
      for (const entry of current30) {
        for (const key of symptomKeys) {
          if (((entry[key as keyof LogEntry] as number) ?? 0) > 0) {
            freq[key] = (freq[key] || 0) + 1;
          }
        }
      }
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        topRecurringCount = sorted[0][1];
        topRecurringName = symptomLabels[sorted[0][0]] || sorted[0][0];
      }
    }

    // Highest pain (single worst score in 30 days)
    let highestPainScore = "\u2014";
    let highestPainName = "";
    if (current30.length > 0) {
      const painKeys = ["pelvic_pain", "lower_back_pain", "leg_pain", "chest_pain", "shoulder_pain", "headache", "bowel_pain", "urination_pain", "bowel_urination_pain", "intercourse_pain"] as const;
      let maxVal = 0;
      let maxKey = "";
      for (const entry of current30) {
        for (const key of painKeys) {
          const val = (entry[key as keyof LogEntry] as number) ?? 0;
          if (val > maxVal) {
            maxVal = val;
            maxKey = key;
          }
        }
      }
      if (maxVal > 0) {
        highestPainScore = `${maxVal}/10`;
        highestPainName = symptomLabels[maxKey] || maxKey;
      }
    }

    return { entriesThisMonth, avgSeverity, topRecurringCount, topRecurringName, highestPainScore, highestPainName };
  }, [current30]);

  /* ── 7-day area chart data ── */

  const { summaryChartData, summaryChartLines, summaryChartColorMap } = useMemo(() => {
    if (last7.length === 0) return { summaryChartData: [], summaryChartLines: [], summaryChartColorMap: {} };

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

    const rows: { label: string; [k: string]: number | string }[] = [];
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
      const row: { label: string; [k: string]: number | string } = { label: dayLabel };
      for (const key of top5Keys) {
        row[key] = entry ? (entry[key as keyof LogEntry] as number) : 0;
      }
      rows.push(row);
    }

    return { summaryChartData: rows, summaryChartLines: lines, summaryChartColorMap: colorMap };
  }, [last7, today]);

  /* ── Top symptoms with trend arrows ── */

  const topSymptomTrends = useMemo(() => {
    if (current30.length === 0) return [];

    const currentAvgs: Record<string, number> = {};
    for (const key of numericKeys) {
      let sum = 0;
      for (const entry of current30) sum += entry[key] as number;
      currentAvgs[key] = sum / current30.length;
    }

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

  /* ── Weekly overview strip ── */

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

  /* ── History chart data ── */

  const customStartDate = useMemo(() => new Date(customStart + "T00:00:00"), [customStart]);
  const customEndDate = useMemo(() => new Date(customEnd + "T00:00:00"), [customEnd]);

  const chartData = useMemo(
    () => aggregateEntries(chronological, timeRange, refDate, customStartDate, customEndDate),
    [chronological, timeRange, refDate, customStartDate, customEndDate],
  );

  // Filtered entries for area charts (raw entries within selected range)
  const filteredChronological = useMemo(() => {
    const { start, end } = getRange(refDate, timeRange, customStartDate, customEndDate);
    const startStr = fmtDate(start);
    const endStr = fmtDate(end);
    return chronological.filter((e) => e.log_date >= startStr && e.log_date <= endStr);
  }, [chronological, timeRange, refDate, customStartDate, customEndDate]);

  /* ── Export handlers ── */

  function handleExportCsv() {
    const headers = ["Date", ...numericKeys.map((k) => symptomLabels[k] || k), "Cycle Phase", "Notes"];
    const rows = entries.map((e) => [
      e.log_date,
      ...numericKeys.map((k) => String(e[k])),
      e.cycle_phase ? formatCyclePhase(e.cycle_phase) : "",
      e.notes ? `"${e.notes.replace(/"/g, '""')}"` : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "symptom-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 15;

    function addFooter() {
      doc.setFontSize(9);
      doc.setTextColor(120, 113, 108);
      doc.text("Living with Endo", pw / 2, ph - 10, { align: "center" });
    }

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(44, 40, 37);
    doc.text("Symptom Log Summary", pw / 2, 25, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);
    const rangeLabel = getRangeLabel(refDate, timeRange, customStartDate, customEndDate);
    doc.text(rangeLabel, pw / 2, 33, { align: "center" });

    let y = 45;

    const { start, end } = getRange(refDate, timeRange, customStartDate, customEndDate);
    const rangeEntries = entries.filter(
      (e) => e.log_date >= fmtDate(start) && e.log_date <= fmtDate(end)
    );

    if (rangeEntries.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(44, 40, 37);
      doc.text("No entries in this period.", pw / 2, y, { align: "center" });
      addFooter();
      doc.save("symptom-log-summary.pdf");
      return;
    }

    for (const entry of rangeEntries) {
      if (y > ph - 30) {
        addFooter();
        doc.addPage();
        y = margin;
      }

      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(44, 40, 37);
      doc.text(entry.log_date, margin, y);
      y += 6;

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 75, 70);
      const nonZero = numericKeys
        .filter((k) => entry[k] > 0)
        .map((k) => `${symptomLabels[k]}: ${entry[k]}/10`);

      if (nonZero.length > 0) {
        const symptomLine = doc.splitTextToSize(nonZero.join("  ·  "), pw - margin * 2);
        for (const line of symptomLine) {
          if (y > ph - 30) { addFooter(); doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 5;
        }
      }

      if (entry.cycle_phase) {
        if (y > ph - 30) { addFooter(); doc.addPage(); y = margin; }
        doc.text(`Cycle: ${formatCyclePhase(entry.cycle_phase)}`, margin, y);
        y += 5;
      }

      if (entry.notes) {
        if (y > ph - 30) { addFooter(); doc.addPage(); y = margin; }
        const noteLines = doc.splitTextToSize(`Notes: ${entry.notes}`, pw - margin * 2);
        for (const line of noteLines) {
          if (y > ph - 30) { addFooter(); doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 5;
        }
      }

      y += 4;
    }

    addFooter();
    doc.save("symptom-log-summary.pdf");
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-screen justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <div className="mb-8">
            <p className="section-label">Dashboard</p>
            <h1 className="font-serif text-3xl font-light text-foreground">Log Overview</h1>
          </div>
          <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
            <h2 className="font-serif text-lg font-semibold text-foreground">No entries yet</h2>
            <p className="text-sm text-muted">
              Once you start logging symptoms, your overview and trends will appear here.
            </p>
            <a
              href="/dashboard/log"
              className="inline-block rounded-full bg-foreground px-6 py-2 text-sm font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Log your first entry
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center py-10 md:py-16 px-4 md:px-6">
      <div className="w-full max-w-2xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Dashboard</p>
            <h1 className="font-serif text-3xl font-light text-foreground">Log Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = cardTheme === "dark" ? "light" : "dark";
                setCardTheme(next);
                localStorage.setItem("cardTheme", next);
              }}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-all hover:bg-surface"
              title={`Switch to ${cardTheme === "dark" ? "light" : "dark"} cards`}
            >
              {cardTheme === "dark" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
              {cardTheme === "dark" ? "Light" : "Dark"}
            </button>
            <a
              href="/dashboard/log"
              className="rounded-full bg-foreground px-3 py-1 text-sm font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              + New entry
            </a>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

        {/* ═══════════════════════════════════════════════════
            AT A GLANCE (from Summary)
            ═══════════════════════════════════════════════════ */}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { value: String(stats.entriesThisMonth), label: "Logs This Month", size: "text-2xl" },
            { value: String(stats.avgSeverity), label: "Avg Severity", size: "text-2xl" },
            { value: stats.topRecurringName, label: "Top Symptom", size: "text-base" },
            { value: stats.highestPainScore, label: "Highest Pain Level", size: "text-xl" },
          ].map((card) => (
            <div
              key={card.label}
              className={`${c.statCard} flex flex-col`}
              style={{ height: 96 }}
            >
              {c.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
              <div className="relative flex flex-1 items-center justify-center">
                <p className={`font-serif font-semibold ${c.textStrong} ${card.size}`}>{card.value}</p>
              </div>
              <p className={`relative text-xs ${c.label}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Trends (7-Day Area Chart) */}
        {summaryChartLines.length > 0 && (
          <div className={c.card}>
            {c.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
            <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${c.label}`}>
              Weekly Overview
            </p>
            <h2 className={`relative mt-1 mb-3 font-serif text-lg ${c.title}`}>
              Recent Trends (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={summaryChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <defs>
                  {summaryChartLines.map((line) => (
                    <linearGradient key={line.key} id={`summary-area-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.axis }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: c.axis }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={(props) => <ModernTooltip {...props} colorMap={summaryChartColorMap} theme={cardTheme} />}
                  cursor={{ stroke: c.cursor, strokeDasharray: "4 4", strokeWidth: 1 }}
                  wrapperStyle={{ zIndex: 1000 }}
                  isAnimationActive={false}
                />
                {summaryChartLines.map((line) => (
                  <Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color}
                    fill={`url(#summary-area-${line.key})`}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: line.color, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: line.color, strokeWidth: 3, fill: "#fff", strokeOpacity: 0.6 }}
                    animationDuration={800}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs">
              {summaryChartLines.map((line) => (
                <div key={line.key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-[3px]"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className={c.legendText}>{line.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Symptoms with Trend Arrows */}
        {topSymptomTrends.length > 0 && (
          <div className={c.card}>
            {c.overlay && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-green/[0.06] to-transparent" />}
            <p className={`relative text-xs font-medium uppercase tracking-[0.12em] ${c.label}`}>
              Overview
            </p>
            <h2 className={`relative mt-1 mb-4 font-serif text-lg ${c.title}`}>
              Top Symptoms
            </h2>
            <div className="relative space-y-3">
              {topSymptomTrends.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className={`w-36 shrink-0 text-sm truncate ${c.text}`}>{item.label}</span>
                  <span className={`w-10 shrink-0 text-right text-sm font-semibold tabular-nums ${c.textStrong}`}>
                    {item.avg}/10
                  </span>
                  <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${c.progressBg}`}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.avg / 10) * 100}%`,
                        backgroundColor:
                          item.avg <= 2 ? "#A8C49A"
                          : item.avg <= 5 ? "#E0C878"
                          : item.avg <= 7 ? "#D4836E"
                          : "#C4685A",
                      }}
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
            <p className={`relative mt-3 text-xs ${c.label}`}>
              Compared to previous 30 days — <span className="inline-flex items-center gap-0.5"><ArrowDown /> improving</span> · <span className="inline-flex items-center gap-0.5"><ArrowUp /> worsening</span> · <span className="inline-flex items-center gap-0.5"><Dash /> stable</span>
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            AI INSIGHTS
            ═══════════════════════════════════════════════════ */}

        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-2">Powered by AI</p>
              <h2 className="font-serif text-2xl font-light text-foreground">
                AI Insights
              </h2>
            </div>
            <button
              onClick={async () => {
                setInsightsLoading(true);
                setInsightsError("");
                setInsights(null);
                try {
                  const res = await fetch("/api/insights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      logs: filteredChronological,
                      hormonalTreatment: profileHormonalTreatment,
                      hormonalTreatmentStartDate: profileHormonalStartDate,
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to generate insights");
                  }
                  const data = await res.json();
                  setInsights(data);
                } catch (err: unknown) {
                  setInsightsError(err instanceof Error ? err.message : "Something went wrong");
                } finally {
                  setInsightsLoading(false);
                }
              }}
              disabled={insightsLoading || entries.length === 0}
              className="rounded-full bg-accent-green px-5 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {insightsLoading ? "Analysing..." : "Analyse My Data"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Get personalised insights about correlations between your lifestyle triggers, cycle phases, and symptom patterns.
          </p>

          {insightsError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {insightsError}
            </div>
          )}

          {insightsLoading && (
            <div className="mt-6 flex flex-col items-center gap-3 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
              <p className="text-sm text-muted">Analysing your symptom data...</p>
            </div>
          )}

          {insights && !insightsLoading && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <h3 className="font-serif text-base font-semibold text-foreground">Trigger Correlations</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{insights.triggerCorrelations}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-serif text-base font-semibold text-foreground">Cycle Phase Patterns</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{insights.cyclePatterns}</p>
              </div>

              {insights.hormonalTreatment && (
                <div className="rounded-xl border border-border bg-surface p-5 md:col-span-2">
                  <div className="mb-2 flex items-center gap-2">
                    <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                    <h3 className="font-serif text-base font-semibold text-foreground">Hormonal Treatment Impact</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{insights.hormonalTreatment}</p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <h3 className="font-serif text-base font-semibold text-foreground">Trends Over Time</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{insights.trends}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <h3 className="font-serif text-base font-semibold text-foreground">Key Observations</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{insights.keyObservations}</p>
              </div>

              <div className="rounded-xl border border-accent-green/30 bg-accent-green/[0.04] p-5 md:col-span-2">
                <h3 className="mb-1 font-serif text-base font-semibold text-foreground">Summary</h3>
                <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>
              </div>

              <p className="text-[11px] text-muted/60 md:col-span-2">
                These insights are generated by AI based on your logged data. They are not medical advice — always consult your healthcare provider for treatment decisions.
              </p>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            DETAILED HISTORY
            ═══════════════════════════════════════════════════ */}

        <div className="border-t border-border pt-8">
          <p className="section-label mb-2">Detailed History</p>
          <h2 className="font-serif text-2xl font-light text-foreground">
            Trends Over Time
          </h2>
        </div>

        {/* Time range selector */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTimeRange(opt.value); setRefDate(new Date()); }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  timeRange === opt.value
                    ? "bg-foreground text-surface"
                    : "bg-surface text-foreground hover:bg-foreground/[0.06]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {timeRange === "Custom" && (
            <div className="flex items-center justify-center gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent-green focus:outline-none"
                />
              </div>
              <span className="mt-5 text-muted">&ndash;</span>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent-green focus:outline-none"
                />
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted">
            {getRangeLabel(refDate, timeRange, customStartDate, customEndDate)}
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleExportCsv}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-foreground hover:text-surface"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-foreground hover:text-surface"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Area charts – trends over time (show when 2+ entries) */}
        {filteredChronological.length >= 2 && (
          <div className="space-y-6">
            <SymptomAreaChart title="Pain Levels" data={filteredChronological} lines={painLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} theme={cardTheme} />
            <SymptomAreaChart title="Other Symptoms" data={filteredChronological} lines={otherLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} theme={cardTheme} />
            <SymptomAreaChart title="Lifestyle Triggers" data={filteredChronological} lines={lifestyleLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} theme={cardTheme} />
          </div>
        )}

        {/* Heatmap – daily view matching selected time range */}
        <DailyHeatmap entries={filteredChronological} theme={cardTheme} />

        {/* Daily logs – collapsible section */}
        <div className="space-y-2">
          <button
            onClick={() => setDailyLogsOpen(!dailyLogsOpen)}
            className="flex w-full items-center justify-between py-2"
          >
            <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Detailed List of Daily Log Entries</h2>
            <span className={`text-muted transition-transform duration-200 ${dailyLogsOpen ? "rotate-180" : ""}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {dailyLogsOpen && (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {entries.map((entry) => {
              const isOpen = expandedId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="group flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 hover:bg-surface hover:pl-5"
                    style={{ borderLeft: "3px solid transparent", transition: "border-color 0.2s ease, padding-left 0.2s ease, background-color 0.2s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "var(--accent-green)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
                  >
                    <span className="text-sm font-medium text-foreground">{entry.log_date}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 text-muted transition-transform duration-300"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                    <div className="space-y-3 px-4 pb-4 pt-1">
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-serif text-sm font-semibold tracking-tight text-muted">Pain Levels</p>
                        <p>Pelvic: {entry.pelvic_pain}/10 · Lower Back: {entry.lower_back_pain}/10 · Leg: {entry.leg_pain}/10</p>
                        <p>Headache: {entry.headache}/10 · Chest: {entry.chest_pain}/10 · Shoulder: {entry.shoulder_pain}/10</p>
                        <p>Bowel: {entry.bowel_pain ?? entry.bowel_urination_pain}/10 · Urination: {entry.urination_pain ?? entry.bowel_urination_pain}/10 · Intercourse: {entry.intercourse_pain}/10</p>
                      </div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-serif text-sm font-semibold tracking-tight text-muted">Other Symptoms</p>
                        <p>Bloating: {entry.bloating}/10 · Nausea: {entry.nausea}/10 · Diarrhea: {entry.diarrhea}/10</p>
                        <p>Constipation: {entry.constipation}/10 · Fatigue: {entry.fatigue}/10 · Inflammation: {entry.inflammation}/10</p>
                        <p>Mood: {entry.mood}/10</p>
                      </div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-serif text-sm font-semibold tracking-tight text-muted">Lifestyle Triggers</p>
                        <p>Stress: {entry.stress}/10 · Inactivity: {entry.inactivity}/10 · Overexertion: {entry.overexertion}/10</p>
                        <p>Caffeine: {entry.coffee}/10 · Alcohol: {entry.alcohol}/10 · Smoking: {entry.smoking}/10</p>
                        <p>Diet: {entry.diet}/10 · Sleep Quality: {entry.sleep}/10</p>
                      </div>
                      {entry.cycle_phase && (
                        <p className="text-sm text-foreground">Cycle: {formatCyclePhase(entry.cycle_phase)}</p>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-muted">{entry.notes}</p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <a
                          href={`/dashboard/log?id=${entry.id}`}
                          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-surface"
                        >
                          Edit
                        </a>
                        <button
                          onClick={async () => {
                            if (!window.confirm("Delete this entry? This cannot be undone.")) return;
                            const { error } = await supabase
                              .from("symptom_logs")
                              .delete()
                              .eq("id", entry.id);
                            if (error) {
                              alert(error.message);
                            } else {
                              setEntries(entries.filter((e) => e.id !== entry.id));
                              setExpandedId(null);
                            }
                          }}
                          className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </div>
      </div>
    </div>
  );
}
