"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SYMPTOM_FIELDS = [
  { key: "leg_pain", label: "Leg pain" },
  { key: "lower_back_pain", label: "Lower back pain" },
  { key: "chest_pain", label: "Chest pain" },
  { key: "shoulder_pain", label: "Shoulder pain" },
  { key: "headache", label: "Headache" },
  { key: "pelvic_pain", label: "Pelvic pain" },
  { key: "bowel_urination_pain", label: "Bowel/urination pain" },
  { key: "intercourse_pain", label: "Intercourse pain" },
  { key: "bloating", label: "Bloating" },
  { key: "nausea", label: "Nausea" },
  { key: "diarrhea", label: "Diarrhea" },
  { key: "constipation", label: "Constipation" },
  { key: "fatigue", label: "Fatigue" },
  { key: "inflammation", label: "Inflammation" },
  { key: "mood", label: "Mood" },
  { key: "stress", label: "Stress" },
  { key: "inactivity", label: "Inactivity" },
  { key: "overexertion", label: "Overexertion" },
  { key: "coffee", label: "Coffee" },
  { key: "alcohol", label: "Alcohol" },
  { key: "smoking", label: "Smoking" },
  { key: "diet", label: "Diet" },
  { key: "sleep", label: "Sleep" },
] as const;

type Insights = {
  entriesThisMonth: number;
  daysSinceLastLog: number;
  topSymptoms: { label: string; avg: number }[];
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hasLogs, setHasLogs] = useState<boolean | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.name) {
          setDisplayName(profile.name);
        }

        const { count } = await supabase
          .from("symptom_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id);

        const logCount = count ?? 0;
        setHasLogs(logCount > 0);

        if (logCount > 0) {
          // Fetch last 30 days of logs for insights
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

          const { data: recentLogs } = await supabase
            .from("symptom_logs")
            .select("*")
            .eq("user_id", data.user.id)
            .gte("log_date", cutoff)
            .order("log_date", { ascending: false });

          // Get the most recent log date for "days since last log"
          const { data: lastRow } = await supabase
            .from("symptom_logs")
            .select("log_date")
            .eq("user_id", data.user.id)
            .order("log_date", { ascending: false })
            .limit(1)
            .single();

          const daysSince = lastRow
            ? Math.floor(
                (Date.now() - new Date(lastRow.log_date + "T00:00:00").getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

          const logs = recentLogs ?? [];
          let topSymptoms: { label: string; avg: number }[] = [];

          if (logs.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = logs as any[];
            topSymptoms = SYMPTOM_FIELDS.map((field) => {
              const sum = rows.reduce(
                (acc: number, log) => acc + (Number(log[field.key]) || 0),
                0
              );
              return { label: field.label, avg: Math.round((sum / rows.length) * 10) / 10 };
            })
              .filter((s) => s.avg > 0)
              .sort((a, b) => b.avg - a.avg)
              .slice(0, 3);
          }

          setInsights({
            entriesThisMonth: logs.length,
            daysSinceLastLog: daysSince,
            topSymptoms,
          });
        }
      }
    });
  }, []);

  if (hasLogs === null) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-24">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      {hasLogs ? (
        <>
          {email && <p className="text-muted">Welcome back, {displayName || email}</p>}
          <div className="flex gap-4">
            <a
              href="/dashboard/log"
              className="rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Log symptoms
            </a>
            <a
              href="/dashboard/history"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              View history
            </a>
          </div>

          {/* Insights card */}
          {insights && (
            <div className="w-full max-w-md space-y-4 rounded-md border border-border bg-surface px-6 py-5">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                Your insights
              </h2>

              <div className="flex justify-between text-sm">
                <span className="text-muted">Entries (last 30 days)</span>
                <span className="font-medium text-foreground">{insights.entriesThisMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Last logged</span>
                <span className="font-medium text-foreground">
                  {insights.daysSinceLastLog === 0
                    ? "Today"
                    : insights.daysSinceLastLog === 1
                      ? "1 day ago"
                      : `${insights.daysSinceLastLog} days ago`}
                </span>
              </div>

              {insights.entriesThisMonth >= 3 && insights.topSymptoms.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-sm font-medium text-foreground">Top symptoms (30-day avg)</p>
                  {insights.topSymptoms.map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">{s.label}</span>
                        <span className="text-foreground">{s.avg}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border">
                        <div
                          className="h-1.5 rounded-full bg-accent-green"
                          style={{ width: `${(s.avg / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Log a few more entries to see your top symptom trends.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Welcome to Living with Endo
          </h2>
          <p className="text-sm text-muted">
            Start tracking your symptoms to discover patterns and take control of your health.
          </p>
          <a
            href="/dashboard/log"
            className="inline-block rounded-md bg-accent-green px-6 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Log your first entry
          </a>
        </div>
      )}
    </div>
  );
}
