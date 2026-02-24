"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  digestion: number;
  fatigue: number;
  inflammation: number;
  mood: number;
  stress: number;
  physical_activity: number;
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

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login");
        return;
      }

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
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-md space-y-6">
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
                  <p>Bloating: {entry.bloating}/10 · Nausea: {entry.nausea}/10 · Digestion: {entry.digestion}/10</p>
                  <p>Fatigue: {entry.fatigue}/10 · Inflammation: {entry.inflammation}/10 · Mood: {entry.mood}/10</p>
                </div>

                {/* Lifestyle factors */}
                <div className="text-sm space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Lifestyle factors</p>
                  <p>Stress: {entry.stress}/10 · Activity: {entry.physical_activity}/10 · Coffee: {entry.coffee}/10</p>
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
        )}
      </div>
    </div>
  );
}
