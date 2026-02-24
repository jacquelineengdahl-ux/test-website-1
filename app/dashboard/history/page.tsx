"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
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

export default function HistoryPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  // Charts need chronological order (oldest first)
  const chronological = [...entries].reverse();

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
            {/* Charts (show when 2+ entries) */}
            {chronological.length >= 2 && (
              <div className="space-y-8">
                <SymptomChart title="Pain" data={chronological} lines={painLines} />
                <SymptomChart title="Other symptoms" data={chronological} lines={otherLines} />
                <SymptomChart title="Lifestyle factors" data={chronological} lines={lifestyleLines} />
              </div>
            )}

            {/* Daily log cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Daily logs</h2>
              <ul className="space-y-4">
                {entries.map((entry) => (
                  <li key={entry.id} className="rounded border p-4 space-y-3">
                    <p className="font-medium">{entry.log_date}</p>

                    {/* Pain */}
                    <div className="text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Pain</p>
                      <p>Leg: {entry.leg_pain}/10 · Lower back: {entry.lower_back_pain}/10 · Chest: {entry.chest_pain}/10</p>
                      <p>Shoulder: {entry.shoulder_pain}/10 · Headache: {entry.headache}/10 · Pelvic: {entry.pelvic_pain}/10</p>
                      <p>Bowel/urination: {entry.bowel_urination_pain}/10 · Intercourse: {entry.intercourse_pain}/10</p>
                    </div>

                    {/* Other symptoms */}
                    <div className="text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Other symptoms</p>
                      <p>Bloating: {entry.bloating}/10 · Nausea: {entry.nausea}/10 · Diarrhea: {entry.diarrhea}/10</p>
                      <p>Constipation: {entry.constipation}/10 · Fatigue: {entry.fatigue}/10 · Inflammation: {entry.inflammation}/10</p>
                      <p>Mood: {entry.mood}/10</p>
                    </div>

                    {/* Lifestyle factors */}
                    <div className="text-sm space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Lifestyle factors</p>
                      <p>Stress: {entry.stress}/10 · Inactivity: {entry.inactivity}/10 · Overexertion: {entry.overexertion}/10</p>
                      <p>Coffee: {entry.coffee}/10</p>
                      <p>Alcohol: {entry.alcohol}/10 · Smoking: {entry.smoking}/10 · Diet: {entry.diet}/10 · Sleep: {entry.sleep}/10</p>
                    </div>

                    {entry.cycle_phase && (
                      <p className="text-sm">Cycle: {formatCyclePhase(entry.cycle_phase)}</p>
                    )}

                    {entry.notes && (
                      <p className="text-sm opacity-70">{entry.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
