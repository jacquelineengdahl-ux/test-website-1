"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [painLevel, setPainLevel] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [moodLevel, setMoodLevel] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      } else {
        router.replace("/login");
      }
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSubmitting(true);

    const { error } = await supabase.from("symptom_logs").insert({
      user_id: userId,
      log_date: logDate,
      pain_level: painLevel,
      fatigue_level: fatigueLevel,
      mood_level: moodLevel,
      notes: notes || null,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard/history");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Log symptoms</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="log-date" className="block text-sm font-medium mb-1">
              Date
            </label>
            <input
              id="log-date"
              type="date"
              required
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="pain-level" className="block text-sm font-medium mb-1">
              Pain level: {painLevel}/10
            </label>
            <input
              id="pain-level"
              type="range"
              min={0}
              max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="fatigue-level" className="block text-sm font-medium mb-1">
              Fatigue level: {fatigueLevel}/10
            </label>
            <input
              id="fatigue-level"
              type="range"
              min={0}
              max={10}
              value={fatigueLevel}
              onChange={(e) => setFatigueLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="mood-level" className="block text-sm font-medium mb-1">
              Mood level: {moodLevel}/10
            </label>
            <input
              id="mood-level"
              type="range"
              min={0}
              max={10}
              value={moodLevel}
              onChange={(e) => setMoodLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-foreground text-background py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
