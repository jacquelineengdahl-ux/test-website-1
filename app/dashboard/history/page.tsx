"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
  { key: "leg_pain", label: "Leg", color: "#e74c3c" },
  { key: "lower_back_pain", label: "Lower back", color: "#e67e22" },
  { key: "chest_pain", label: "Chest", color: "#f1c40f" },
  { key: "shoulder_pain", label: "Shoulder", color: "#2ecc71" },
  { key: "headache", label: "Headache", color: "#1abc9c" },
  { key: "pelvic_pain", label: "Pelvic", color: "#3498db" },
  { key: "bowel_urination_pain", label: "Bowel/urination", color: "#9b59b6" },
  { key: "intercourse_pain", label: "Intercourse", color: "#e84393" },
];

const otherLines = [
  { key: "bloating", label: "Bloating", color: "#e74c3c" },
  { key: "nausea", label: "Nausea", color: "#e67e22" },
  { key: "diarrhea", label: "Diarrhea", color: "#f1c40f" },
  { key: "constipation", label: "Constipation", color: "#2ecc71" },
  { key: "fatigue", label: "Fatigue", color: "#3498db" },
  { key: "inflammation", label: "Inflammation", color: "#9b59b6" },
  { key: "mood", label: "Mood", color: "#e84393" },
];

const lifestyleLines = [
  { key: "stress", label: "Stress", color: "#e74c3c" },
  { key: "inactivity", label: "Inactivity", color: "#2ecc71" },
  { key: "overexertion", label: "Overexertion", color: "#1abc9c" },
  { key: "coffee", label: "Coffee", color: "#e67e22" },
  { key: "alcohol", label: "Alcohol", color: "#f1c40f" },
  { key: "smoking", label: "Smoking", color: "#95a5a6" },
  { key: "diet", label: "Diet", color: "#3498db" },
  { key: "sleep", label: "Sleep", color: "#9b59b6" },
];

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
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="log_date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
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
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">{title}</h2>
        <p className="text-sm opacity-50 text-center py-8">No data for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Bar
              key={line.key}
              dataKey={line.key}
              name={line.label}
              stackId="stack"
              fill={line.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-2xl space-y-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">History</h1>
          <a
            href="/dashboard/log"
            className="rounded bg-foreground text-background px-3 py-1 text-sm font-medium hover:opacity-90"
          >
            + New entry
          </a>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {entries.length === 0 ? (
          <p className="text-center text-sm">
            No entries yet.{" "}
            <a href="/dashboard/log" className="underline">
              Log your first one.
            </a>
          </p>
        ) : (
          <>
            {/* Time range selector */}
            <div className="space-y-3">
              {/* D / W / M / Y toggle */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg border overflow-hidden text-sm font-medium">
                  {(["D", "W", "M", "Y"] as TimeRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setTimeRange(r); setRefDate(new Date()); }}
                      className={`px-4 py-1.5 transition-colors ${
                        timeRange === r
                          ? "bg-foreground text-background"
                          : "hover:bg-foreground/10"
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
                  className="rounded p-1 hover:bg-foreground/10 text-lg leading-none"
                >
                  ‹
                </button>
                <span className="text-sm font-medium min-w-[10rem] text-center">
                  {getRangeLabel(refDate, timeRange)}
                </span>
                <button
                  onClick={() => setRefDate(navigate(refDate, timeRange, 1))}
                  className="rounded p-1 hover:bg-foreground/10 text-lg leading-none"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Stacked bar charts */}
            <div className="space-y-6">
              <SymptomBarChart title="Pain" data={chartData} lines={painLines} />
              <SymptomBarChart title="Other symptoms" data={chartData} lines={otherLines} />
              <SymptomBarChart title="Lifestyle factors" data={chartData} lines={lifestyleLines} />
            </div>

            {/* Line charts – trends over time (show when 2+ entries) */}
            {chronological.length >= 2 && (
              <div className="space-y-8">
                <h2 className="text-lg font-semibold">Trends</h2>
                <SymptomChart title="Pain" data={chronological} lines={painLines} />
                <SymptomChart title="Other symptoms" data={chronological} lines={otherLines} />
                <SymptomChart title="Lifestyle factors" data={chronological} lines={lifestyleLines} />
              </div>
            )}

            {/* Daily logs – clickable accordion */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Daily logs</h2>
              <ul className="divide-y rounded border overflow-hidden">
                {entries.map((entry) => {
                  const isOpen = expandedId === entry.id;
                  return (
                    <li key={entry.id}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : entry.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-foreground/5 transition-colors"
                      >
                        <span className="font-medium text-sm">{entry.log_date}</span>
                        <span className="text-xs opacity-50">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Pain</p>
                            <p>Leg: {entry.leg_pain}/10 · Lower back: {entry.lower_back_pain}/10 · Chest: {entry.chest_pain}/10</p>
                            <p>Shoulder: {entry.shoulder_pain}/10 · Headache: {entry.headache}/10 · Pelvic: {entry.pelvic_pain}/10</p>
                            <p>Bowel/urination: {entry.bowel_urination_pain}/10 · Intercourse: {entry.intercourse_pain}/10</p>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Other symptoms</p>
                            <p>Bloating: {entry.bloating}/10 · Nausea: {entry.nausea}/10 · Diarrhea: {entry.diarrhea}/10</p>
                            <p>Constipation: {entry.constipation}/10 · Fatigue: {entry.fatigue}/10 · Inflammation: {entry.inflammation}/10</p>
                            <p>Mood: {entry.mood}/10</p>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Lifestyle factors</p>
                            <p>Stress: {entry.stress}/10 · Inactivity: {entry.inactivity}/10 · Overexertion: {entry.overexertion}/10</p>
                            <p>Coffee: {entry.coffee}/10 · Alcohol: {entry.alcohol}/10 · Smoking: {entry.smoking}/10</p>
                            <p>Diet: {entry.diet}/10 · Sleep: {entry.sleep}/10</p>
                          </div>
                          {entry.cycle_phase && (
                            <p className="text-sm">Cycle: {formatCyclePhase(entry.cycle_phase)}</p>
                          )}
                          {entry.notes && (
                            <p className="text-sm opacity-70">{entry.notes}</p>
                          )}
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
