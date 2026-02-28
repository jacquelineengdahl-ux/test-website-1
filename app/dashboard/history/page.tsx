"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const painLines = [
  { key: "leg_pain", label: "Leg", color: "#f2a0a0" },
  { key: "lower_back_pain", label: "Lower back", color: "#f0c08a" },
  { key: "chest_pain", label: "Chest", color: "#f0dc82" },
  { key: "shoulder_pain", label: "Shoulder", color: "#a0dab0" },
  { key: "headache", label: "Headache", color: "#88d4c8" },
  { key: "pelvic_pain", label: "Pelvic", color: "#92c4e8" },
  { key: "bowel_urination_pain", label: "Bowel/urination", color: "#c4a8e0" },
  { key: "intercourse_pain", label: "Intercourse", color: "#eba8c8" },
];

const otherLines = [
  { key: "bloating", label: "Bloating", color: "#f2a0a0" },
  { key: "nausea", label: "Nausea", color: "#f0c08a" },
  { key: "diarrhea", label: "Diarrhea", color: "#f0dc82" },
  { key: "constipation", label: "Constipation", color: "#a0dab0" },
  { key: "fatigue", label: "Fatigue", color: "#92c4e8" },
  { key: "inflammation", label: "Inflammation", color: "#c4a8e0" },
  { key: "mood", label: "Mood", color: "#eba8c8" },
];

const lifestyleLines = [
  { key: "stress", label: "Stress", color: "#f2a0a0" },
  { key: "inactivity", label: "Inactivity", color: "#a0dab0" },
  { key: "overexertion", label: "Overexertion", color: "#88d4c8" },
  { key: "coffee", label: "Coffee", color: "#f0c08a" },
  { key: "alcohol", label: "Alcohol", color: "#f0dc82" },
  { key: "smoking", label: "Smoking", color: "#c8c0b8" },
  { key: "diet", label: "Diet", color: "#92c4e8" },
  { key: "sleep", label: "Sleep", color: "#c4a8e0" },
];

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
  if (value === 0 || value == null) return "rgba(214, 208, 200, 0.15)";
  if (value <= 1) return "#d5e8d4";
  if (value <= 2) return "#b6d7a8";
  if (value <= 3) return "#93c47d";
  if (value <= 4) return "#f0dc82";
  if (value <= 5) return "#f0c08a";
  if (value <= 6) return "#e8a87c";
  if (value <= 7) return "#e88a6e";
  if (value <= 8) return "#e06b5e";
  if (value <= 9) return "#cc4125";
  return "#a61c00";
}

function HeatmapGrid({ data }: { data: ChartRow[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: number; value: number; x: number; y: number } | null>(null);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">Heatmap</h2>
        <p className="py-8 text-center text-sm text-muted">No data for this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-serif text-lg font-semibold tracking-tight text-foreground">Heatmap</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface pr-2 text-left font-medium text-muted" style={{ minWidth: 120 }} />
              {data.map((d, i) => (
                <th key={i} className="px-0.5 pb-1 text-center font-medium text-muted" style={{ minWidth: 28 }}>
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
                {group.keys.map((key) => (
                  <tr key={key}>
                    <td className="sticky left-0 z-10 bg-surface pr-2 py-0.5 text-left text-muted" style={{ minWidth: 120 }}>
                      {symptomLabels[key] || key}
                    </td>
                    {data.map((d, colIdx) => {
                      const val = typeof d[key] === "number" ? (d[key] as number) : 0;
                      return (
                        <td
                          key={colIdx}
                          className="px-0.5 py-0.5"
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setHoveredCell({ row: symptomLabels[key] || key, col: colIdx, value: val, x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div
                            className="mx-auto rounded-sm transition-colors"
                            style={{
                              width: 22,
                              height: 22,
                              backgroundColor: getHeatColor(val),
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {hoveredCell && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 36,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-medium text-foreground">{hoveredCell.row}</span>
          <span className="text-muted"> · </span>
          <span className="font-semibold text-foreground">{hoveredCell.value}/10</span>
        </div>
      )}
      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted">
        <span>Low</span>
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <div key={v} className="rounded-sm" style={{ width: 14, height: 14, backgroundColor: getHeatColor(v) }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonZero = payload.filter((p: any) => (p.value ?? 0) > 0);
  if (nonZero.length === 0) return null;
  return (
    <div
      style={{
        background: "rgba(250, 248, 245, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid #d6d0c8",
        borderRadius: 10,
        padding: "6px 10px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#2c2825" }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {nonZero.map((entry: any) => (
        <div key={entry.name || entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: "18px" }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: entry.color || entry.fill || entry.stroke || "#999",
            }}
          />
          <span style={{ color: "#78716c" }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: "#2c2825" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[40px] text-xs text-foreground">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}


function SymptomChart({
  title,
  data,
  lines,
}: {
  title: string;
  data: LogEntry[];
  lines: { key: string; label: string; color: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2">
      <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <XAxis dataKey="log_date" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            wrapperStyle={{ zIndex: 1000 }}
            isAnimationActive={false}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ r: 2, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={lines} />
    </div>
  );
}

function SymptomBarChart({
  title,
  data,
  lines,
}: {
  title: string;
  data: ChartRow[];
  lines: { key: string; label: string; color: string }[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2">
        <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">{title}</h2>
        <p className="py-8 text-center text-sm text-muted">No data for this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-2">
      <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-muted">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={1} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: "transparent" }}
            isAnimationActive={false}
          />
          {lines.map((line, idx) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              name={line.label}
              stackId="stack"
              fill={`url(#grad-${line.key})`}
              radius={idx === lines.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={lines} />
    </div>
  );
}

type TimeRange = "D" | "W" | "M" | "Y";

const numericKeys = [
  "leg_pain","lower_back_pain","chest_pain","shoulder_pain","headache",
  "pelvic_pain","bowel_urination_pain","intercourse_pain","bloating","nausea",
  "diarrhea","constipation","fatigue","inflammation","mood","stress",
  "inactivity","overexertion","coffee","alcohol","smoking","diet","sleep",
] as const;

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
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
    case "Y":
      return {
        start: new Date(ref.getFullYear(), 0, 1),
        end: new Date(ref.getFullYear(), 11, 31),
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
    case "Y":
      return new Date(ref.getFullYear() + dir, ref.getMonth(), 1);
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
    case "Y":
      return ref.getFullYear().toString();
  }
}

/** Average entries that share the same bucket label */
type ChartRow = { label: string; [k: string]: number | string };

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
    // One bar per day
    return filtered.map((e) => {
      const row: ChartRow = { label: e.log_date.slice(5) };
      for (const k of numericKeys) row[k] = e[k];
      return row;
    });
  }

  if (range === "M") {
    // One bar per day, short label
    return filtered.map((e) => {
      const d = new Date(e.log_date + "T00:00:00");
      const row: ChartRow = { label: d.getDate().toString() };
      for (const k of numericKeys) row[k] = e[k];
      return row;
    });
  }

  // Year: average by month
  const buckets: Record<string, { sum: Record<string, number>; count: number }> = {};
  for (const e of filtered) {
    const d = new Date(e.log_date + "T00:00:00");
    const monthKey = fmtMonth(d);
    if (!buckets[monthKey]) {
      buckets[monthKey] = { sum: Object.fromEntries(numericKeys.map((k) => [k, 0])), count: 0 };
    }
    buckets[monthKey].count++;
    for (const k of numericKeys) buckets[monthKey].sum[k] += e[k];
  }

  // Keep month order
  const monthOrder = Array.from({ length: 12 }, (_, i) =>
    new Date(ref.getFullYear(), i, 1).toLocaleDateString("en", { month: "short" }),
  );

  return monthOrder
    .filter((m) => buckets[m])
    .map((m) => {
      const b = buckets[m];
      const row: ChartRow = { label: m };
      for (const k of numericKeys) row[k] = Math.round((b.sum[k] / b.count) * 10) / 10;
      return row;
    });
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("W");
  const [refDate, setRefDate] = useState(() => new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Charts need chronological order (oldest first, left to right)
  const chronological = useMemo(
    () => [...entries].sort((a, b) => a.log_date.localeCompare(b.log_date)),
    [entries],
  );

  const chartData = useMemo(
    () => aggregateEntries(chronological, timeRange, refDate),
    [chronological, timeRange, refDate],
  );

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

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(44, 40, 37);
    doc.text("Symptom Log Summary", pw / 2, 25, { align: "center" });

    // Date range
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);
    const rangeLabel = getRangeLabel(refDate, timeRange);
    doc.text(rangeLabel, pw / 2, 33, { align: "center" });

    let y = 45;

    // Filter entries to current range
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

      // Date header
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(44, 40, 37);
      doc.text(entry.log_date, margin, y);
      y += 6;

      // Non-zero symptoms
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

      y += 4; // spacing between entries
    }

    addFooter();
    doc.save("symptom-log-summary.pdf");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-2xl space-y-10 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">History</h1>
          <a
            href="/dashboard/log"
            className="rounded-md bg-accent-green px-3 py-1 text-sm font-medium text-white hover:opacity-90"
          >
            + New entry
          </a>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {entries.length === 0 ? (
          <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
            <h2 className="font-serif text-lg font-semibold text-foreground">No entries yet</h2>
            <p className="text-sm text-muted">
              Once you start logging symptoms, your history and trends will appear here.
            </p>
            <a
              href="/dashboard/log"
              className="inline-block rounded-md bg-accent-green px-6 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Log your first entry
            </a>
          </div>
        ) : (
          <>
            {/* Time range selector */}
            <div className="space-y-3">
              {/* D / W / M / Y toggle */}
              <div className="flex justify-center">
                <div className="inline-flex overflow-hidden rounded-md border border-border text-sm font-medium">
                  {(["D", "W", "M", "Y"] as TimeRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setTimeRange(r); setRefDate(new Date()); }}
                      className={`px-4 py-1.5 transition-colors ${
                        timeRange === r
                          ? "bg-accent-green text-white"
                          : "text-foreground hover:bg-surface"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation arrows + label */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setRefDate(navigate(refDate, timeRange, -1))}
                  className="rounded p-1 text-lg leading-none text-muted hover:bg-surface hover:text-foreground"
                >
                  ‹
                </button>
                <span className="min-w-[10rem] text-center text-sm font-medium text-foreground">
                  {getRangeLabel(refDate, timeRange)}
                </span>
                <button
                  onClick={() => setRefDate(navigate(refDate, timeRange, 1))}
                  className="rounded p-1 text-lg leading-none text-muted hover:bg-surface hover:text-foreground"
                >
                  ›
                </button>
              </div>

              {/* Export buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleExportCsv}
                  className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportPdf}
                  className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Heatmap grid */}
            <HeatmapGrid data={chartData} />

            {/* Stacked bar charts */}
            <div className="space-y-6">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground border-b border-border pb-2">Trends</h2>
              <SymptomBarChart title="Pain Levels" data={chartData} lines={painLines} />
              <SymptomBarChart title="Other Symptoms" data={chartData} lines={otherLines} />
              <SymptomBarChart title="Lifestyle Factors" data={chartData} lines={lifestyleLines} />
            </div>

            {/* Line charts – trends over time (show when 2+ entries) */}
            {chronological.length >= 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground border-b border-border pb-2">Line diagrams</h2>
                <SymptomChart title="Pain Levels" data={chronological} lines={painLines} />
                <SymptomChart title="Other Symptoms" data={chronological} lines={otherLines} />
                <SymptomChart title="Lifestyle Factors" data={chronological} lines={lifestyleLines} />
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
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface"
                      >
                        <span className="text-sm font-medium text-foreground">{entry.log_date}</span>
                        <span className="text-xs text-muted">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="space-y-3 px-4 pb-4">
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
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
