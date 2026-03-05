"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

/* ─── Types & constants ─────────────────────────────────── */

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

const SYMPTOM_KEYS = [
  "pelvic_pain", "lower_back_pain", "leg_pain", "chest_pain", "shoulder_pain",
  "headache", "bowel_urination_pain", "intercourse_pain", "bloating", "nausea",
  "diarrhea", "constipation", "fatigue", "inflammation", "mood",
] as const;

const LIFESTYLE_KEYS = [
  "stress", "inactivity", "overexertion", "coffee", "alcohol", "smoking", "diet", "sleep",
] as const;

const ALL_KEYS = [...SYMPTOM_KEYS, ...LIFESTYLE_KEYS];

const LABELS: Record<string, string> = {
  pelvic_pain: "Pelvic Pain",
  lower_back_pain: "Back Pain",
  leg_pain: "Leg Pain",
  chest_pain: "Chest Pain",
  shoulder_pain: "Shoulder Pain",
  headache: "Headache",
  bowel_urination_pain: "Bowel/Urination",
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

const RADAR_AXES = [
  { key: "pelvic_pain", label: "Pelvic" },
  { key: "lower_back_pain", label: "Back" },
  { key: "headache", label: "Headache" },
  { key: "fatigue", label: "Fatigue" },
  { key: "bloating", label: "Bloating" },
  { key: "mood", label: "Mood" },
  { key: "stress", label: "Stress" },
  { key: "sleep", label: "Sleep" },
];

const CYCLE_LABELS: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  on_pill: "On the pill",
};

/* ─── Helpers ───────────────────────────────────────────── */

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatCyclePhase(phase: string): string {
  if (phase.startsWith("other:")) return phase.slice(6);
  return CYCLE_LABELS[phase] ?? phase;
}

function getVal(entry: LogEntry, key: string): number {
  return (entry[key as keyof LogEntry] as number) || 0;
}

/* ─── Main component ────────────────────────────────────── */

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.name) setDisplayName(profile.name);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentLogs } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", thirtyDaysAgo.toISOString().slice(0, 10))
        .order("log_date", { ascending: false });

      setLogs((recentLogs as LogEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => fmtDate(today), [today]);
  const logCount = logs.length;

  /* ── Today's log ── */
  const todayLog = useMemo(
    () => logs.find((l) => l.log_date === todayStr) ?? null,
    [logs, todayStr],
  );

  /* ── Today's stats ── */
  const todayStats = useMemo(() => {
    if (!todayLog) return null;
    let sum = 0;
    let count = 0;
    const symptoms: { key: string; value: number }[] = [];

    for (const key of ALL_KEYS) {
      const val = getVal(todayLog, key);
      if (val > 0) {
        sum += val;
        count++;
        symptoms.push({ key, value: val });
      }
    }

    symptoms.sort((a, b) => b.value - a.value);

    return {
      avgSeverity: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      topSymptoms: symptoms.slice(0, 4),
      cyclePhase: todayLog.cycle_phase,
    };
  }, [todayLog]);

  /* ── 7-day logs for flare detection ── */
  const last7Logs = useMemo(() => {
    const sevenAgo = new Date(today);
    sevenAgo.setDate(sevenAgo.getDate() - 7);
    const sevenStr = fmtDate(sevenAgo);
    return logs.filter((l) => l.log_date > sevenStr);
  }, [logs, today]);

  /* ── Flare detection (3+ logs required) ── */
  const flareInfo = useMemo(() => {
    if (logCount < 3 || last7Logs.length < 2) return null;

    const latest = logs[0];
    let maxDiff = 0;
    let spikeKey = "";
    let spikeValue = 0;
    let spikeAvg = 0;

    for (const key of SYMPTOM_KEYS) {
      const val = getVal(latest, key);
      let sum = 0;
      for (const log of last7Logs) sum += getVal(log, key);
      const avg = sum / last7Logs.length;
      const diff = val - avg;

      if (diff > maxDiff) {
        maxDiff = diff;
        spikeKey = key;
        spikeValue = val;
        spikeAvg = avg;
      }
    }

    if (maxDiff >= 3) {
      return {
        type: "flare" as const,
        label: LABELS[spikeKey] || spikeKey,
        value: spikeValue,
        avg: Math.round(spikeAvg * 10) / 10,
      };
    }
    return { type: "steady" as const, label: "", value: 0, avg: 0 };
  }, [logs, logCount, last7Logs]);

  /* ── 7-Day Calendar ── */
  const calendarDays = useMemo(() => {
    const logDates = new Set(logs.map((l) => l.log_date));
    const days: { dateStr: string; dayNum: string; label: string; logged: boolean; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = fmtDate(d);
      days.push({
        dateStr,
        dayNum: d.getDate().toString(),
        label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
        logged: logDates.has(dateStr),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [logs, today, todayStr]);

  /* ── Streak ── */
  const streak = useMemo(() => {
    const logDates = new Set(logs.map((l) => l.log_date));
    let count = 0;
    const check = new Date(today);
    if (!logDates.has(fmtDate(check))) {
      check.setDate(check.getDate() - 1);
    }
    while (logDates.has(fmtDate(check))) {
      count++;
      check.setDate(check.getDate() - 1);
    }
    return count;
  }, [logs, today]);

  /* ── Radar chart data (most recent log) ── */
  const radarData = useMemo(() => {
    if (logCount === 0) return [];
    const latest = logs[0];
    return RADAR_AXES.map((axis) => ({
      subject: axis.label,
      value: getVal(latest, axis.key),
    }));
  }, [logs, logCount]);

  /* ── Pattern Insight / Correlation (5+ logs) ── */
  const correlationInsight = useMemo(() => {
    if (logCount < 5) return null;

    let best: {
      lifestyleKey: string;
      symptomKey: string;
      highAvg: number;
      lowAvg: number;
      diff: number;
    } | null = null;

    for (const lKey of LIFESTYLE_KEYS) {
      const highDays = logs.filter((l) => getVal(l, lKey) >= 5);
      const lowDays = logs.filter((l) => getVal(l, lKey) < 5);

      if (highDays.length < 2 || lowDays.length < 2) continue;

      for (const sKey of SYMPTOM_KEYS) {
        const highAvg =
          highDays.reduce((acc, l) => acc + getVal(l, sKey), 0) / highDays.length;
        const lowAvg =
          lowDays.reduce((acc, l) => acc + getVal(l, sKey), 0) / lowDays.length;
        const diff = highAvg - lowAvg;

        if (diff > 0.5 && (!best || diff > best.diff)) {
          best = {
            lifestyleKey: lKey,
            symptomKey: sKey,
            highAvg: Math.round(highAvg * 10) / 10,
            lowAvg: Math.round(lowAvg * 10) / 10,
            diff,
          };
        }
      }
    }

    return best;
  }, [logs, logCount]);

  /* ── Render ── */

  if (loading) return null;

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-2xl space-y-6 px-4">
        {/* Header with greeting illustration */}
        <div className="text-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="mx-auto mb-3 text-accent-green"
          >
            <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
            <path
              d="M28 12c-2 0-3.5 1.5-3.5 3.5S26 19 28 21c2-2 3.5-3 3.5-5.5S30 12 28 12z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M20 22c-1.5 1-2 3-1 4.5s3 2 4.5 1.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M36 22c1.5 1 2 3 1 4.5s-3 2-4.5 1.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M18 32c2 6 6 10 10 10s8-4 10-10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle cx="22" cy="28" r="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="34" cy="28" r="1.5" fill="currentColor" opacity="0.5" />
            <path
              d="M24 34c1.5 1.5 4.5 1.5 6 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Welcome{displayName ? `, ${displayName}` : email ? `, ${email}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">
            We&apos;re glad you&apos;re here. Take it one day at a time.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-border bg-surface px-5 py-3 text-center text-xs leading-5 text-muted">
          This is a self-tracking and reflection tool to support daily awareness
          and communication with your healthcare provider. It does not provide
          medical advice or diagnoses.
        </div>

        {/* Not logged today reminder (returning users only) */}
        {logCount > 0 && !todayLog && (
          <div className="flex items-center justify-between rounded-xl border border-accent-green/30 bg-accent-green/10 px-5 py-4">
            <p className="text-sm text-foreground">
              You haven&apos;t logged today yet.
            </p>
            <a
              href="/dashboard/log"
              className="shrink-0 rounded-md bg-accent-green px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Log now
            </a>
          </div>
        )}

        {/* Nav buttons */}
        <div className="space-y-3">
          <p className="text-center font-serif text-base font-medium text-foreground">
            What would you like to do today?
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/dashboard/log"
              className="flex-1 rounded-md bg-accent-green px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
            >
              Log symptoms
            </a>
            <a
              href="/dashboard/overview"
              className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-surface"
            >
              Log Overview
            </a>
          </div>
        </div>

        {logCount === 0 ? (
          /* ── Empty state ── */
          <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Welcome to Living with Endo
            </h2>
            <p className="text-sm text-muted">
              Start tracking your symptoms to discover patterns and take control
              of your health.
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
            {/* ── Flare Alert Banner (3+ logs) ── */}
            {flareInfo && flareInfo.type === "flare" && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-5 py-4 dark:border-amber-700/50 dark:bg-amber-950/30">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                >
                  <path
                    d="M9 1.5L1.5 15.5h15L9 1.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 7v3.5M9 13v.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Heads up — {flareInfo.label} is notably higher than your
                    recent average
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {flareInfo.value}/10 vs {flareInfo.avg} avg over the past
                    week
                  </p>
                </div>
              </div>
            )}
            {flareInfo && flareInfo.type === "steady" && (
              <div className="flex items-start gap-3 rounded-xl border border-accent-green/30 bg-accent-green/10 px-5 py-4">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="mt-0.5 shrink-0 text-accent-green"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5.5 9.5l2.5 2.5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Looking steady
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Your recent symptoms are in line with your averages
                  </p>
                </div>
              </div>
            )}

            {/* ── Progressive Unlock (1-4 logs) ── */}
            {logCount >= 1 && logCount < 5 && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="text-accent-green"
                  >
                    <path
                      d="M9 1v16M1 9h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <h2 className="font-serif text-base font-semibold tracking-tight text-foreground">
                    Keep going
                  </h2>
                </div>
                <div className="space-y-2 text-sm">
                  {logCount < 3 && (
                    <p className="text-muted">
                      {3 - logCount} more {3 - logCount === 1 ? "log" : "logs"} to
                      unlock flare detection
                    </p>
                  )}
                  {logCount < 5 && (
                    <p className="text-muted">
                      {5 - logCount} more {5 - logCount === 1 ? "log" : "logs"} to
                      unlock pattern insights
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{logCount} of 5 logs</span>
                    <span>{Math.round((logCount / 5) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-accent-green transition-all"
                      style={{ width: `${(logCount / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Today's Status Card ── */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              {todayStats ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/15">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8.5l3 3 7-7"
                          stroke="var(--accent-green)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                      Logged today
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-bold text-foreground">
                      {todayStats.avgSeverity}
                    </span>
                    <span className="text-sm text-muted">/10 avg severity</span>
                  </div>

                  {todayStats.topSymptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {todayStats.topSymptoms.map((s) => (
                        <span
                          key={s.key}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {LABELS[s.key] || s.key} {s.value}/10
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {todayStats.cyclePhase ? (
                      <span className="text-xs text-muted">
                        {formatCyclePhase(todayStats.cyclePhase)}
                      </span>
                    ) : (
                      <span />
                    )}
                    {todayLog && (
                      <a
                        href={`/dashboard/log?id=${todayLog.id}`}
                        className="text-xs font-medium text-accent-green hover:underline"
                      >
                        Edit entry
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                    How are you feeling today?
                  </h2>
                  <p className="text-sm text-muted">
                    Take a moment to check in with your body and log your
                    symptoms.
                  </p>
                  <a
                    href="/dashboard/log"
                    className="inline-block rounded-md bg-accent-green px-5 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Log today&apos;s symptoms
                  </a>
                </div>
              )}
            </div>

            {/* ── 7-Day Logging Calendar ── */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-base font-semibold tracking-tight text-foreground">
                  Past 7 days
                </h2>
                {streak > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-accent-green/10 px-2.5 py-0.5 text-xs font-medium text-accent-green">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-accent-green"
                    >
                      <path
                        d="M6 1C6 1 9 3.5 9 7C9 8.93 7.66 10.5 6 10.5C4.34 10.5 3 8.93 3 7C3 5.5 4 4 4.5 3.5C4.5 3.5 5 5 5.5 5C5.85 5 6 4.5 6 4C6 3 6 1 6 1Z"
                        fill="currentColor"
                      />
                    </svg>
                    {streak} day streak
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                {calendarDays.map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: day.logged
                          ? "var(--accent-green)"
                          : "transparent",
                        color: day.logged ? "white" : "var(--text-muted)",
                        border: day.logged
                          ? "2px solid var(--accent-green)"
                          : day.isToday
                            ? "2px solid var(--accent-green)"
                            : "2px dashed var(--border-color)",
                      }}
                    >
                      {day.dayNum}
                    </div>
                    <span className="text-xs text-muted">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Radar + Pattern grid ── */}
            <div
              className={
                correlationInsight
                  ? "grid gap-6 sm:grid-cols-2"
                  : ""
              }
            >
              {/* Symptom Radar Chart */}
              {radarData.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="mb-1 text-center font-serif text-base font-semibold tracking-tight text-foreground">
                    Symptom Shape
                  </h2>
                  <p className="mb-3 text-center text-xs text-muted">
                    Most recent entry
                  </p>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="var(--border-color)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="value"
                        stroke="var(--accent-green)"
                        fill="var(--accent-green)"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pattern Insight Card (5+ logs) */}
              {correlationInsight && (
                <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <h2 className="mb-3 font-serif text-base font-semibold tracking-tight text-foreground">
                    Pattern Insight
                  </h2>
                  <p className="mb-4 text-sm text-foreground">
                    On days when{" "}
                    <span className="font-semibold">
                      {LABELS[correlationInsight.lifestyleKey]}
                    </span>{" "}
                    is high, your{" "}
                    <span className="font-semibold">
                      {LABELS[correlationInsight.symptomKey]}
                    </span>{" "}
                    tends to be higher.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>
                          {LABELS[correlationInsight.lifestyleKey]} high days
                        </span>
                        <span className="font-medium text-foreground">
                          {correlationInsight.highAvg}/10
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border">
                        <div
                          className="h-2 rounded-full bg-accent-green"
                          style={{
                            width: `${(correlationInsight.highAvg / 10) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>
                          {LABELS[correlationInsight.lifestyleKey]} low days
                        </span>
                        <span className="font-medium text-foreground">
                          {correlationInsight.lowAvg}/10
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(correlationInsight.lowAvg / 10) * 100}%`,
                            backgroundColor: "var(--text-muted)",
                            opacity: 0.35,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
