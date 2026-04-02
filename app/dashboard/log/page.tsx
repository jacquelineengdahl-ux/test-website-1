"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculatePillDay, type PillDayInfo } from "@/lib/hormonal-treatments";

/* ─── Pill Button Scale ─────────────────────────────────── */

type LevelOption = { label: string; value: number };

const SEVERITY_LEVELS: LevelOption[] = [
  { label: "None", value: 0 },
  { label: "Mild", value: 2 },
  { label: "Moderate", value: 5 },
  { label: "Severe", value: 7 },
  { label: "Extreme", value: 10 },
];

const QUALITY_LEVELS: LevelOption[] = [
  { label: "Perfect", value: 0 },
  { label: "Okey", value: 2 },
  { label: "Mixed", value: 5 },
  { label: "Poor", value: 7 },
  { label: "Terrible", value: 10 },
];

function valueToLevel(v: number): number {
  if (v === 0) return 0;
  if (v <= 2) return 2;
  if (v <= 5) return 5;
  if (v <= 7) return 7;
  return 10;
}

function pillStyle(isSelected: boolean, value: number): string {
  if (!isSelected) return "bg-background text-muted hover:bg-foreground/[0.04] hover:text-foreground";
  if (value === 0) return "bg-foreground/10 text-foreground ring-1 ring-foreground/20";
  if (value <= 2) return "bg-accent-green/20 text-accent-green ring-1 ring-accent-green/30";
  if (value <= 5) return "bg-gold-light/25 text-foreground ring-1 ring-gold-light/40";
  if (value <= 7) return "bg-accent-clay/20 text-accent-clay ring-1 ring-accent-clay/30";
  return "bg-accent-clay/30 text-accent-clay ring-1 ring-accent-clay/50";
}

function PillSelect({
  id,
  label,
  value,
  onChange,
  levels = SEVERITY_LEVELS,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  levels?: LevelOption[];
}) {
  const selected = valueToLevel(value);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 transition-all">
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      <div className="flex gap-2">
        {levels.map((level) => {
          const isSelected = selected === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`flex-1 rounded-full py-2 text-xs font-medium transition-all ${pillStyle(isSelected, level.value)}`}
              aria-label={`${label}: ${level.label}`}
              id={isSelected ? id : undefined}
            >
              {level.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section Toggle ────────────────────────────────────── */

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2"
      >
        <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
        <span
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

/* ─── Log Form ──────────────────────────────────────────── */

function LogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isFirst = searchParams.get("first") === "1";

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(!!editId);
  const [error, setError] = useState("");

  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  // Pain
  const [legPain, setLegPain] = useState(0);
  const [lowerBackPain, setLowerBackPain] = useState(0);
  const [chestPain, setChestPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [pelvicPain, setPelvicPain] = useState(0);
  const [bowelUrinationPain, setBowelUrinationPain] = useState(0);
  const [bowelPain, setBowelPain] = useState(0);
  const [urinationPain, setUrinationPain] = useState(0);
  const [intercoursePain, setIntercoursePain] = useState(0);

  // Other symptoms
  const [bloating, setBloating] = useState(0);
  const [nausea, setNausea] = useState(0);
  const [diarrhea, setDiarrhea] = useState(0);
  const [constipation, setConstipation] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [inflammation, setInflammation] = useState(0);
  const [mood, setMood] = useState(0);
  const [moodTags, setMoodTags] = useState<string[]>([]);

  // Lifestyle factors
  const [stress, setStress] = useState(0);
  const [inactivity, setInactivity] = useState(0);
  const [overexertion, setOverexertion] = useState(0);
  const [coffee, setCoffee] = useState(0);
  const [alcohol, setAlcohol] = useState(0);
  const [smoking, setSmoking] = useState(0);
  const [diet, setDiet] = useState(0);
  const [sleep, setSleep] = useState(0);

  // Cycle phase
  const [cyclePhases, setCyclePhases] = useState<string[]>([]);
  const [cyclePhaseOther, setCyclePhaseOther] = useState("");

  // Hormonal treatment from profile
  const [profileHormonalTreatment, setProfileHormonalTreatment] = useState("");
  const [profileHormonalBrand, setProfileHormonalBrand] = useState("");
  const [profileTreatmentStartDate, setProfileTreatmentStartDate] = useState("");
  const [pillDayInfo, setPillDayInfo] = useState<PillDayInfo | null>(null);

  // Hormonal treatment note
  const [hormonalTreatmentNote, setHormonalTreatmentNote] = useState("");

  // Calculate pill day whenever log date or treatment info changes
  useEffect(() => {
    if (profileHormonalTreatment && profileTreatmentStartDate && logDate) {
      const info = calculatePillDay(profileHormonalTreatment, profileHormonalBrand, profileTreatmentStartDate, logDate);
      setPillDayInfo(info);
    } else {
      setPillDayInfo(null);
    }
  }, [logDate, profileHormonalTreatment, profileHormonalBrand, profileTreatmentStartDate]);

  // Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);

      // Fetch hormonal treatment from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("hormonal_treatment, hormonal_treatment_start_date")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.hormonal_treatment) {
        const raw = profile.hormonal_treatment;
        if (raw.includes(":")) {
          const [cat, brand] = raw.split(":");
          setProfileHormonalTreatment(cat);
          setProfileHormonalBrand(brand);
        } else {
          setProfileHormonalTreatment(raw);
        }
        if (profile.hormonal_treatment_start_date) {
          setProfileTreatmentStartDate(profile.hormonal_treatment_start_date);
        }
      }

      if (editId) {
        const { data: entry, error } = await supabase
          .from("symptom_logs")
          .select("*")
          .eq("id", editId)
          .eq("user_id", data.user.id)
          .single();

        if (error || !entry) {
          setError("Entry not found.");
          setLoadingEntry(false);
          return;
        }

        setLogDate(entry.log_date);
        setLegPain(entry.leg_pain);
        setLowerBackPain(entry.lower_back_pain);
        setChestPain(entry.chest_pain);
        setShoulderPain(entry.shoulder_pain);
        setHeadache(entry.headache);
        setPelvicPain(entry.pelvic_pain);
        setBowelUrinationPain(entry.bowel_urination_pain);
        setBowelPain(entry.bowel_pain ?? entry.bowel_urination_pain ?? 0);
        setUrinationPain(entry.urination_pain ?? entry.bowel_urination_pain ?? 0);
        setIntercoursePain(entry.intercourse_pain);
        setBloating(entry.bloating);
        setNausea(entry.nausea);
        setDiarrhea(entry.diarrhea);
        setConstipation(entry.constipation);
        setFatigue(entry.fatigue);
        setInflammation(entry.inflammation);
        setMood(entry.mood);
        setMoodTags(entry.mood_tags ?? []);
        setStress(entry.stress);
        setInactivity(entry.inactivity);
        setOverexertion(entry.overexertion);
        setCoffee(entry.coffee);
        setAlcohol(entry.alcohol);
        setSmoking(entry.smoking);
        setDiet(entry.diet);
        setSleep(entry.sleep);
        setNotes(entry.notes ?? "");
        setHormonalTreatmentNote(entry.hormonal_treatment_note ?? "");

        // Parse cycle_phase
        if (entry.cycle_phase) {
          const parts = (entry.cycle_phase as string).split(",");
          const phases: string[] = [];
          let otherText = "";
          for (const p of parts) {
            if (p.startsWith("other:")) {
              phases.push("other");
              otherText = p.slice(6);
            } else {
              phases.push(p);
            }
          }
          setCyclePhases(phases);
          setCyclePhaseOther(otherText);
        }

        setLoadingEntry(false);
      }
    }
    init();
  }, [editId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSubmitting(true);

    const payload = {
      user_id: userId,
      log_date: logDate,
      leg_pain: legPain,
      lower_back_pain: lowerBackPain,
      chest_pain: chestPain,
      shoulder_pain: shoulderPain,
      headache,
      pelvic_pain: pelvicPain,
      bowel_urination_pain: Math.max(bowelPain, urinationPain),
      bowel_pain: bowelPain,
      urination_pain: urinationPain,
      intercourse_pain: intercoursePain,
      bloating,
      nausea,
      diarrhea,
      constipation,
      fatigue,
      inflammation,
      mood,
      mood_tags: moodTags,
      stress,
      inactivity,
      overexertion,
      coffee,
      alcohol,
      smoking,
      diet,
      sleep,
      cycle_phase: (() => {
        const phases = [...cyclePhases];
        const otherIdx = phases.indexOf("other");
        if (otherIdx !== -1 && cyclePhaseOther) {
          phases[otherIdx] = `other:${cyclePhaseOther}`;
        } else if (otherIdx !== -1) {
          phases.splice(otherIdx, 1);
        }
        return phases.length > 0 ? phases.join(",") : null;
      })(),
      hormonal_treatment_note: hormonalTreatmentNote || null,
      pill_day: pillDayInfo?.day ?? null,
      pill_day_phase: pillDayInfo?.phase.name ?? null,
      notes: notes || null,
    };

    const result = editId
      ? await supabase.from("symptom_logs").update(payload).eq("id", editId)
      : await supabase.from("symptom_logs").insert(payload);

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      router.push("/dashboard");
    }
  }

  if (loadingEntry) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading entry...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center px-4 py-10 md:px-6 md:py-16">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="section-label mb-3">Daily Tracking</p>
          <h1 className="font-serif text-3xl font-light text-foreground md:text-4xl">
            {editId ? "Edit entry" : "How are you feeling?"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tap the level that best describes each symptom today
          </p>
        </div>

        {isFirst && (
          <div className="rounded-2xl border border-accent-green/30 bg-accent-green/10 px-5 py-4 text-center text-sm text-foreground">
            <p className="font-medium">Profile saved!</p>
            <p className="mt-1 text-muted">
              Now let&apos;s log how you&apos;re feeling today.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Date */}
          <div>
            <label htmlFor="log-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Date
            </label>
            <input
              id="log-date"
              type="date"
              required
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
            />
          </div>

          {/* Pain */}
          <Section title="Pain levels">
            <PillSelect id="pelvic-pain" label="Pelvic" value={pelvicPain} onChange={setPelvicPain} />
            <PillSelect id="lower-back-pain" label="Lower Back" value={lowerBackPain} onChange={setLowerBackPain} />
            <PillSelect id="leg-pain" label="Leg" value={legPain} onChange={setLegPain} />
            <PillSelect id="headache" label="Headache" value={headache} onChange={setHeadache} />
            <PillSelect id="chest-pain" label="Chest" value={chestPain} onChange={setChestPain} />
            <PillSelect id="shoulder-pain" label="Shoulder" value={shoulderPain} onChange={setShoulderPain} />
            <PillSelect id="bowel-pain" label="Bowel Pain" value={bowelPain} onChange={setBowelPain} />
            <PillSelect id="urination-pain" label="Urination Pain" value={urinationPain} onChange={setUrinationPain} />
            <PillSelect id="intercourse-pain" label="Intercourse" value={intercoursePain} onChange={setIntercoursePain} />
          </Section>

          {/* Other symptoms */}
          <Section title="Other Symptoms">
            <PillSelect id="bloating" label="Bloating" value={bloating} onChange={setBloating} />
            <PillSelect id="nausea" label="Nausea" value={nausea} onChange={setNausea} />
            <PillSelect id="diarrhea" label="Diarrhea" value={diarrhea} onChange={setDiarrhea} />
            <PillSelect id="constipation" label="Constipation" value={constipation} onChange={setConstipation} />
            <PillSelect id="fatigue" label="Fatigue" value={fatigue} onChange={setFatigue} />
            <PillSelect id="inflammation" label="Full Body Inflammation" value={inflammation} onChange={setInflammation} />
          </Section>

          {/* Mood */}
          <Section title="Mood & Emotional State">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="mb-3 text-sm font-medium text-foreground">How are you feeling emotionally?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Normal",
                  "Anxious",
                  "Depressed",
                  "Irritated",
                  "Angry",
                  "Brain fog",
                  "Lethargic",
                  "Forgetful",
                  "Moody",
                  "Emotional",
                  "Hopeful",
                ].map((tag) => {
                  const isSelected = moodTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (tag === "Normal") {
                          setMoodTags(["Normal"]);
                          setMood(0);
                        } else if (isSelected) {
                          const next = moodTags.filter((t) => t !== tag);
                          setMoodTags(next);
                          if (next.length === 0) setMood(0);
                        } else {
                          const next = [...moodTags.filter((t) => t !== "Normal"), tag];
                          setMoodTags(next);
                          if (mood === 0) setMood(2);
                        }
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-accent-green/20 text-accent-green ring-1 ring-accent-green/30"
                          : "bg-background text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {moodTags.length > 0 && moodTags[0] !== "Normal" && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Overall severity
                  </p>
                  <div className="flex gap-2">
                    {[
                      { label: "Mild", value: 2 },
                      { label: "Moderate", value: 5 },
                      { label: "Severe", value: 7 },
                    ].map((level) => {
                      const isActive = valueToLevel(mood) === level.value;
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setMood(level.value)}
                          className={`flex-1 rounded-full py-2 text-xs font-medium transition-all ${
                            isActive
                              ? level.value <= 2
                                ? "bg-accent-green/20 text-accent-green ring-1 ring-accent-green/30"
                                : level.value <= 5
                                  ? "bg-gold-light/25 text-foreground ring-1 ring-gold-light/40"
                                  : "bg-accent-clay/20 text-accent-clay ring-1 ring-accent-clay/30"
                              : "bg-background text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                          }`}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Lifestyle Triggers */}
          <Section title="Lifestyle Triggers">
            <PillSelect id="stress" label="Stress" value={stress} onChange={setStress} />

            {/* Physical Activity — controls both inactivity & overexertion */}
            <div className="rounded-2xl border border-border bg-surface p-4 transition-all">
              <p className="mb-3 text-sm font-medium text-foreground">Physical Activity</p>
              <div className="flex gap-2">
                {[
                  { label: "Passive", inact: 10, over: 0 },
                  { label: "Mild inactivity", inact: 5, over: 0 },
                  { label: "Normal", inact: 0, over: 0 },
                  { label: "Active", inact: 0, over: 2 },
                  { label: "Overexertion", inact: 0, over: 10 },
                ].map((opt) => {
                  const isSelected =
                    inactivity === opt.inact && overexertion === opt.over;
                  const severity = Math.max(opt.inact, opt.over);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setInactivity(opt.inact);
                        setOverexertion(opt.over);
                      }}
                      className={`flex-1 rounded-full py-2 text-xs font-medium transition-all ${pillStyle(isSelected, severity)}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <PillSelect id="coffee" label="Caffeine Intake" value={coffee} onChange={setCoffee} />
            <PillSelect id="alcohol" label="Alcohol Intake" value={alcohol} onChange={setAlcohol} />
            <PillSelect id="smoking" label="Smoking" value={smoking} onChange={setSmoking} />
            <PillSelect id="diet" label="Diet" value={diet} onChange={setDiet} levels={QUALITY_LEVELS} />
            <PillSelect id="sleep" label="Sleep Quality" value={sleep} onChange={setSleep} levels={QUALITY_LEVELS} />
          </Section>

          {/* Cycle phase */}
          <Section title="Menstrual Cycle Phase">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "menstrual", label: "Menstrual (Day 1-5)" },
                { value: "follicular", label: "Follicular (Day 1-13)" },
                { value: "ovulation", label: "Ovulation (Day 14)" },
                { value: "luteal", label: "Luteal (Day 15-28)" },
                { value: "on_hormonal_treatment", label: "On Hormonal Treatment" },
                { value: "other", label: "Other" },
              ].map((option) => {
                const isSelected = cyclePhases.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCyclePhases(cyclePhases.filter((p) => p !== option.value));
                      } else {
                        setCyclePhases([...cyclePhases, option.value]);
                      }
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-accent-green/20 text-accent-green ring-1 ring-accent-green/30"
                        : "bg-background text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {cyclePhases.includes("on_hormonal_treatment") && profileHormonalTreatment && (
              <div className="mt-3 rounded-xl bg-accent-green/[0.06] px-4 py-2.5">
                <p className="text-xs text-muted">
                  Currently: <span className="font-medium text-foreground">{profileHormonalTreatment}{profileHormonalBrand ? ` · ${profileHormonalBrand}` : ""}</span>
                  {" "}&middot;{" "}
                  <a href="/profile" className="text-accent-green underline">Update in profile</a>
                </p>
                {pillDayInfo && (
                  <div className="mt-2 rounded-lg bg-surface border border-border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Day {pillDayInfo.day} of {pillDayInfo.totalDays}
                        <span className="ml-2 text-xs text-muted">Pack #{pillDayInfo.packNumber}</span>
                      </p>
                      <span className="rounded-full bg-accent-green/15 border border-accent-green/30 px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {pillDayInfo.phase.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{pillDayInfo.phase.description}</p>
                  </div>
                )}
              </div>
            )}
            {cyclePhases.includes("on_hormonal_treatment") && !profileHormonalTreatment && (
              <p className="mt-3 rounded-xl bg-accent-green/[0.06] px-4 py-2.5 text-xs text-muted">
                No hormonal treatment set in your profile yet.{" "}
                <a href="/profile" className="text-accent-green underline">Add it in profile</a>
              </p>
            )}
            {cyclePhases.includes("on_hormonal_treatment") && (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Treatment observation (optional)
                </label>
                <textarea
                  rows={2}
                  value={hormonalTreatmentNote}
                  onChange={(e) => setHormonalTreatmentNote(e.target.value)}
                  placeholder="E.g. Week 2 of new pack — feeling more moody than usual"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 resize-y focus:border-accent-green focus:outline-none"
                />
              </div>
            )}
            {cyclePhases.includes("other") && (
              <input
                type="text"
                placeholder="Please specify"
                value={cyclePhaseOther}
                onChange={(e) => setCyclePhaseOther(e.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
              />
            )}
          </Section>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you want to note about today..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground focus:border-accent-green focus:outline-none"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-foreground py-3.5 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? "Saving…" : editId ? "Update entry" : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted">Loading...</p></div>}>
      <LogForm />
    </Suspense>
  );
}
