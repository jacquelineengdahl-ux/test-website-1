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

const cyclePhaseLabels: Record<string, string> = {
  menstrual: "Menstrual phase",
  follicular: "Follicular phase",
  ovulation: "Ovulation",
  luteal: "Luteal phase",
  on_pill: "On the pill",
};

function formatCyclePhase(phase: string): string {
  if (phase.startsWith("other:")) return phase.slice(6);
  return cyclePhaseLabels[phase] ?? phase;
}

const numericKeys = [
  "leg_pain","lower_back_pain","chest_pain","shoulder_pain","headache",
  "pelvic_pain","bowel_urination_pain","intercourse_pain","bloating","nausea",
  "diarrhea","constipation","fatigue","inflammation","mood","stress",
  "inactivity","overexertion","coffee","alcohol","smoking","diet","sleep",
] as const;

/* ─── Tableau 10 palette ──────────────────────────────── */

const T10 = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
];

const painLines = [
  { key: "leg_pain", label: "Leg", color: T10[0] },
  { key: "lower_back_pain", label: "Lower back", color: T10[1] },
  { key: "chest_pain", label: "Chest", color: T10[2] },
  { key: "shoulder_pain", label: "Shoulder", color: T10[3] },
  { key: "headache", label: "Headache", color: T10[4] },
  { key: "pelvic_pain", label: "Pelvic", color: T10[5] },
  { key: "bowel_urination_pain", label: "Bowel/urination", color: T10[6] },
  { key: "intercourse_pain", label: "Intercourse", color: T10[7] },
];

const otherLines = [
  { key: "bloating", label: "Bloating", color: T10[0] },
  { key: "nausea", label: "Nausea", color: T10[1] },
  { key: "diarrhea", label: "Diarrhea", color: T10[2] },
  { key: "constipation", label: "Constipation", color: T10[3] },
  { key: "fatigue", label: "Fatigue", color: T10[4] },
  { key: "inflammation", label: "Inflammation", color: T10[5] },
  { key: "mood", label: "Mood", color: T10[6] },
];

const lifestyleLines = [
  { key: "stress", label: "Stress", color: T10[0] },
  { key: "inactivity", label: "Inactivity", color: T10[1] },
  { key: "overexertion", label: "Overexertion", color: T10[2] },
  { key: "coffee", label: "Coffee", color: T10[3] },
  { key: "alcohol", label: "Alcohol", color: T10[4] },
  { key: "smoking", label: "Smoking", color: T10[5] },
  { key: "diet", label: "Diet", color: T10[6] },
  { key: "sleep", label: "Sleep", color: T10[7] },
];

const seriesColorMap: Record<string, string> = {};
[painLines, otherLines, lifestyleLines].forEach((group) =>
  group.forEach((l) => { seriesColorMap[l.key] = l.color; }),
);

const heatmapGroups = [
  {
    label: "Pain",
    keys: ["leg_pain", "lower_back_pain", "chest_pain", "shoulder_pain", "headache", "pelvic_pain", "bowel_urination_pain", "intercourse_pain"],
  },
  {
    label: "Symptoms",
    keys: ["bloating", "nausea", "diarrhea", "constipation", "fatigue", "inflammation", "mood"],
  },
  {
    label: "Lifestyle",
    keys: ["stress", "inactivity", "overexertion", "coffee", "alcohol", "smoking", "diet", "sleep"],
  },
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

type TimeRange = "D" | "W" | "M" | "3M" | "6M" | "Y" | "All";
type ChartRow = { label: string; [k: string]: number | string };

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "D", label: "D" },
  { value: "W", label: "W" },
  { value: "M", label: "M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "Y", label: "Y" },
  { value: "All", label: "All" },
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

function getRange(ref: Date, range: TimeRange): { start: Date; end: Date } {
  switch (range) {
    case "D":
      return { start: ref, end: ref };
    case "W": {
      const s = startOfWeek(ref);
      return { start: s, end: addDays(s, 6) };
    }
    case "M":
      return {
        start: new Date(ref.getFullYear(), ref.getMonth(), 1),
        end: new Date(ref.getFullYear(), ref.getMonth() + 1, 0),
      };
    case "3M": {
      const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      const startDate = new Date(ref.getFullYear(), ref.getMonth() - 2, 1);
      return { start: startDate, end: endDate };
    }
    case "6M": {
      const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      const startDate = new Date(ref.getFullYear(), ref.getMonth() - 5, 1);
      return { start: startDate, end: endDate };
    }
    case "Y":
      return {
        start: new Date(ref.getFullYear(), 0, 1),
        end: new Date(ref.getFullYear(), 11, 31),
      };
    case "All":
      return {
        start: new Date(2000, 0, 1),
        end: new Date(2099, 11, 31),
      };
  }
}

function navigate(ref: Date, range: TimeRange, dir: -1 | 1): Date {
  switch (range) {
    case "D":
      return addDays(ref, dir);
    case "W":
      return addDays(ref, dir * 7);
    case "M":
      return new Date(ref.getFullYear(), ref.getMonth() + dir, 1);
    case "3M":
      return new Date(ref.getFullYear(), ref.getMonth() + dir * 3, 1);
    case "6M":
      return new Date(ref.getFullYear(), ref.getMonth() + dir * 6, 1);
    case "Y":
      return new Date(ref.getFullYear() + dir, ref.getMonth(), 1);
    case "All":
      return ref;
  }
}

function getRangeLabel(ref: Date, range: TimeRange): string {
  const { start, end } = getRange(ref, range);
  switch (range) {
    case "D":
      return fmtDate(ref);
    case "W":
      return `${fmtShort(start)} – ${fmtShort(end)}`;
    case "M":
      return ref.toLocaleDateString("en", { month: "long", year: "numeric" });
    case "3M":
    case "6M":
      return `${fmtShort(start)} – ${fmtShort(end)}`;
    case "Y":
      return ref.getFullYear().toString();
    case "All":
      return "All time";
  }
}

/* ─── Data aggregation ─────────────────────────────────── */

function aggregateEntries(
  entries: LogEntry[],
  range: TimeRange,
  ref: Date,
): ChartRow[] {
  const { start, end } = getRange(ref, range);
  const startStr = fmtDate(start);
  const endStr = fmtDate(end);

  const filtered = entries.filter(
    (e) => e.log_date >= startStr && e.log_date <= endStr,
  );

  if (range === "D" || range === "W") {
    return filtered.map((e) => {
      const row: ChartRow = { label: e.log_date.slice(5) };
      for (const k of numericKeys) row[k] = e[k];
      return row;
    });
  }

  if (range === "M") {
    return filtered.map((e) => {
      const d = new Date(e.log_date + "T00:00:00");
      const row: ChartRow = { label: d.getDate().toString() };
      for (const k of numericKeys) row[k] = e[k];
      return row;
    });
  }

  if (range === "3M" || range === "6M") {
    // Aggregate by week
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

  // Year / All: average by month
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

  if (range === "Y") {
    const monthOrder = Array.from({ length: 12 }, (_, i) => {
      const key = `${ref.getFullYear()}-${String(i + 1).padStart(2, "0")}`;
      return key;
    });

    return monthOrder
      .filter((m) => buckets[m])
      .map((m) => {
        const b = buckets[m];
        const d = new Date(m + "-01T00:00:00");
        const row: ChartRow = { label: fmtMonth(d) };
        for (const k of numericKeys) row[k] = Math.round((b.sum[k] / b.count) * 10) / 10;
        return row;
      });
  }

  // All: sort chronologically
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

/* ─── Interactive legend ───────────────────────────────── */

function InteractiveLegend({
  items,
  hiddenSeries,
  highlightedSeries,
  onToggle,
  onHighlight,
}: {
  items: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  highlightedSeries: string | null;
  onToggle: (key: string) => void;
  onHighlight: (key: string | null) => void;
}) {
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
              className="text-foreground"
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
}: {
  title: string;
  data: LogEntry[];
  lines: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  onToggleSeries: (key: string) => void;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const visibleLines = lines.filter((l) => !hiddenSeries.has(l.key));
  const colorMap = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.key, l.color])),
    [lines],
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.key} id={`area-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.25)" />
          <XAxis dataKey="log_date" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <ModernTooltip {...props} colorMap={colorMap} />}
            cursor={{ stroke: "#a8a29e", strokeDasharray: "4 4", strokeWidth: 1 }}
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
              dot={{ r: 2, fill: line.color, strokeWidth: 0 }}
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
}: {
  title: string;
  data: ChartRow[];
  lines: { key: string; label: string; color: string }[];
  hiddenSeries: Set<string>;
  onToggleSeries: (key: string) => void;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const visibleLines = lines.filter((l) => !hiddenSeries.has(l.key));
  const colorMap = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.key, l.color])),
    [lines],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">{title}</h2>
        <div className="py-8 text-center">
          <EmptyChartIcon />
          <p className="text-sm text-muted">No data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168, 162, 158, 0.25)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <ModernTooltip {...props} colorMap={colorMap} />}
            cursor={{ fill: "rgba(120, 113, 108, 0.10)" }}
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
      />
    </div>
  );
}

/* ─── Heatmap grid ─────────────────────────────────────── */

function HeatmapGrid({ data }: { data: ChartRow[] }) {
  const [hoveredCell, setHoveredCell] = useState<{
    row: string; col: number; value: number; dateLabel: string; x: number; y: number;
  } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">Heatmap</h2>
        <div className="py-8 text-center">
          <EmptyChartIcon />
          <p className="text-sm text-muted">No data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">Heatmap</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface pr-2 text-left font-medium text-muted" style={{ minWidth: 120 }} />
              {data.map((d, i) => (
                <th key={i} className="px-0.5 pb-1 text-center font-medium text-muted" style={{ minWidth: 32 }}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapGroups.map((group) => (
              <Fragment key={group.label}>
                <tr>
                  <td
                    colSpan={data.length + 1}
                    className="sticky left-0 z-10 bg-surface pt-3 pb-1 font-serif text-xs font-semibold tracking-tight text-muted"
                  >
                    {group.label}
                  </td>
                </tr>
                {group.keys.map((key) => {
                  const isRowHighlighted = hoveredRow === key;
                  const isAnyRowHovered = hoveredRow !== null;
                  return (
                  <tr
                    key={key}
                    style={{
                      opacity: isAnyRowHovered && !isRowHighlighted ? 0.4 : 1,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={() => setHoveredRow(key)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="sticky left-0 z-10 bg-surface pr-2 py-0.5 text-left text-muted" style={{ minWidth: 120 }}>
                      {symptomLabels[key] || key}
                    </td>
                    {data.map((d, colIdx) => {
                      const val = typeof d[key] === "number" ? (d[key] as number) : 0;
                      const isHovered =
                        hoveredCell?.row === (symptomLabels[key] || key) &&
                        hoveredCell?.col === colIdx;

                      return (
                        <td
                          key={colIdx}
                          className="px-0.5 py-0.5"
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setHoveredCell({
                              row: symptomLabels[key] || key,
                              col: colIdx,
                              value: val,
                              dateLabel: String(d.label),
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                            setHoveredRow(key);
                          }}
                          onMouseLeave={() => { setHoveredCell(null); setHoveredRow(null); }}
                        >
                          <div
                            className="mx-auto"
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 5,
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
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg animate-tooltip-in"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 52,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: getHeatColor(hoveredCell.value) }}
            />
            <span className="font-semibold text-foreground">{hoveredCell.row}</span>
          </div>
          <div className="mt-0.5 text-muted">
            {hoveredCell.dateLabel}
            <span className="text-muted"> · </span>
            <span className="font-semibold text-foreground">{hoveredCell.value}/10</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-0.5 text-xs text-muted">
        <span className="mr-1">0</span>
        {Array.from({ length: 11 }, (_, v) => (
          <div key={v} className="rounded-[3px]" style={{ width: 14, height: 14, backgroundColor: getHeatColor(v) }} />
        ))}
        <span className="ml-1">10</span>
      </div>
    </div>
  );
}

/* ─── Main Overview page ───────────────────────────────── */

export default function OverviewPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("W");
  const [refDate, setRefDate] = useState(() => new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* Single data fetch — all entries */
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("symptom_logs")
        .select("*")
        .order("log_date", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setEntries(data ?? []);
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

    let streak = 0;
    if (entriesThisMonth > 0) {
      const logDates = new Set(current30.map((e) => e.log_date));
      const check = new Date(today);
      if (!logDates.has(fmtDate(check))) {
        check.setDate(check.getDate() - 1);
      }
      while (logDates.has(fmtDate(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }

    let lastLoggedLabel = "\u2014";
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => b.log_date.localeCompare(a.log_date));
      const lastDate = sorted[0].log_date;
      const diff = daysBetween(new Date(lastDate + "T00:00:00"), today);
      if (diff <= 0) lastLoggedLabel = "Today";
      else if (diff === 1) lastLoggedLabel = "1 day ago";
      else lastLoggedLabel = `${diff} days ago`;
    }

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

  const chartData = useMemo(
    () => aggregateEntries(chronological, timeRange, refDate),
    [chronological, timeRange, refDate],
  );

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
    const rangeLabel = getRangeLabel(refDate, timeRange);
    doc.text(rangeLabel, pw / 2, 33, { align: "center" });

    let y = 45;

    const { start, end } = getRange(refDate, timeRange);
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
          <h1 className="mb-8 font-serif text-2xl font-semibold tracking-tight text-foreground">Log Overview</h1>
          <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
            <h2 className="font-serif text-lg font-semibold text-foreground">No entries yet</h2>
            <p className="text-sm text-muted">
              Once you start logging symptoms, your overview and trends will appear here.
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
      <div className="w-full max-w-2xl space-y-10 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Log Overview</h1>
          <a
            href="/dashboard/log"
            className="rounded-md bg-accent-green px-3 py-1 text-sm font-medium text-white hover:opacity-90"
          >
            + New entry
          </a>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* ═══════════════════════════════════════════════════
            AT A GLANCE (from Summary)
            ═══════════════════════════════════════════════════ */}

        {/* Quick Stats */}
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

        {/* Recent Trends (7-Day Area Chart) */}
        {summaryChartLines.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-center font-serif text-lg font-semibold tracking-tight text-muted">
              Recent Trends (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={summaryChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <defs>
                  {summaryChartLines.map((line) => (
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
                  content={(props) => <ModernTooltip {...props} colorMap={summaryChartColorMap} />}
                  cursor={{ stroke: "#a8a29e", strokeDasharray: "4 4", strokeWidth: 1 }}
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
                    dot={{ r: 2, fill: line.color, strokeWidth: 0 }}
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
                  <span className="text-foreground">{line.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Symptoms with Trend Arrows */}
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

        {/* Weekly Overview Strip */}
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
          <div className="mt-3 flex items-center justify-center gap-0.5 text-xs text-muted">
            <span className="mr-1">0</span>
            {Array.from({ length: 11 }, (_, v) => (
              <div key={v} className="rounded-[3px]" style={{ width: 14, height: 14, backgroundColor: getHeatColor(v) }} />
            ))}
            <span className="ml-1">10</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            DETAILED HISTORY (from History)
            ═══════════════════════════════════════════════════ */}

        <div className="border-t border-border pt-8">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Detailed History
          </h2>
        </div>

        {/* Time range selector */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex overflow-hidden rounded-md border border-border text-sm font-medium">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTimeRange(opt.value); setRefDate(new Date()); }}
                  className={`px-3 py-1.5 transition-all duration-200 ${
                    timeRange === opt.value
                      ? "bg-accent-green text-white"
                      : "text-foreground hover:bg-surface"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {timeRange !== "All" && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setRefDate(navigate(refDate, timeRange, -1))}
                className="rounded p-1 text-lg leading-none text-muted transition-all duration-200 hover:scale-125 hover:text-accent-green"
              >
                ‹
              </button>
              <span className="min-w-[10rem] text-center text-sm font-medium text-foreground">
                {getRangeLabel(refDate, timeRange)}
              </span>
              <button
                onClick={() => setRefDate(navigate(refDate, timeRange, 1))}
                className="rounded p-1 text-lg leading-none text-muted transition-all duration-200 hover:scale-125 hover:text-accent-green"
              >
                ›
              </button>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={handleExportCsv}
              className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent-green hover:text-white hover:border-accent-green"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent-green hover:text-white hover:border-accent-green"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Heatmap grid */}
        <HeatmapGrid data={chartData} />

        {/* Grouped bar charts */}
        <div className="space-y-6">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground border-b border-border pb-2">Trends</h2>
          <SymptomBarChart title="Pain Levels" data={chartData} lines={painLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
          <SymptomBarChart title="Other Symptoms" data={chartData} lines={otherLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
          <SymptomBarChart title="Lifestyle Factors" data={chartData} lines={lifestyleLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
        </div>

        {/* Area charts – trends over time (show when 2+ entries) */}
        {chronological.length >= 2 && (
          <div className="space-y-6">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground border-b border-border pb-2">Trends Over Time</h2>
            <SymptomAreaChart title="Pain Levels" data={chronological} lines={painLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
            <SymptomAreaChart title="Other Symptoms" data={chronological} lines={otherLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
            <SymptomAreaChart title="Lifestyle Factors" data={chronological} lines={lifestyleLines} hiddenSeries={hiddenSeries} onToggleSeries={toggleSeries} />
          </div>
        )}

        {/* Daily logs – clickable accordion */}
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Daily logs</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {entries.map((entry) => {
              const isOpen = expandedId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="group flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 hover:bg-surface hover:pl-5"
                    style={{ borderLeft: "3px solid transparent", transition: "border-color 0.2s ease, padding-left 0.2s ease, background-color 0.2s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "#59a14f"; }}
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
                        <p>Leg: {entry.leg_pain}/10 · Lower back: {entry.lower_back_pain}/10 · Chest: {entry.chest_pain}/10</p>
                        <p>Shoulder: {entry.shoulder_pain}/10 · Headache: {entry.headache}/10 · Pelvic: {entry.pelvic_pain}/10</p>
                        <p>Bowel/urination: {entry.bowel_urination_pain}/10 · Intercourse: {entry.intercourse_pain}/10</p>
                      </div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-serif text-sm font-semibold tracking-tight text-muted">Other Symptoms</p>
                        <p>Bloating: {entry.bloating}/10 · Nausea: {entry.nausea}/10 · Diarrhea: {entry.diarrhea}/10</p>
                        <p>Constipation: {entry.constipation}/10 · Fatigue: {entry.fatigue}/10 · Inflammation: {entry.inflammation}/10</p>
                        <p>Mood: {entry.mood}/10</p>
                      </div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-serif text-sm font-semibold tracking-tight text-muted">Lifestyle Factors</p>
                        <p>Stress: {entry.stress}/10 · Inactivity: {entry.inactivity}/10 · Overexertion: {entry.overexertion}/10</p>
                        <p>Coffee: {entry.coffee}/10 · Alcohol: {entry.alcohol}/10 · Smoking: {entry.smoking}/10</p>
                        <p>Diet: {entry.diet}/10 · Sleep: {entry.sleep}/10</p>
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
                          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface"
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
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
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
        </div>
      </div>
    </div>
  );
}
