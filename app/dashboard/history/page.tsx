"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LogEntry {
  id: string;
  log_date: string;
  pain_level: number;
  fatigue_level: number;
  mood_level: number;
  notes: string | null;
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
        .select("id, log_date, pain_level, fatigue_level, mood_level, notes")
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
              <li key={entry.id} className="rounded border p-4 space-y-2">
                <p className="font-medium">{entry.log_date}</p>
                <div className="text-sm space-y-1">
                  <p>Pain: {entry.pain_level}/10</p>
                  <p>Fatigue: {entry.fatigue_level}/10</p>
                  <p>Mood: {entry.mood_level}/10</p>
                </div>
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
