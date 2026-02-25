"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function Slider({
  id,
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  id: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}: {value}/10
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-green"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export default function LogPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  // Pain sliders
  const [legPain, setLegPain] = useState(0);
  const [lowerBackPain, setLowerBackPain] = useState(0);
  const [chestPain, setChestPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [pelvicPain, setPelvicPain] = useState(0);
  const [bowelUrinationPain, setBowelUrinationPain] = useState(0);
  const [intercoursePain, setIntercoursePain] = useState(0);

  // Other sliders
  const [bloating, setBloating] = useState(0);
  const [nausea, setNausea] = useState(0);
  const [diarrhea, setDiarrhea] = useState(0);
  const [constipation, setConstipation] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [inflammation, setInflammation] = useState(0);
  const [mood, setMood] = useState(0);

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
  const [cyclePhase, setCyclePhase] = useState("");
  const [cyclePhaseOther, setCyclePhaseOther] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSubmitting(true);

    const { error } = await supabase.from("symptom_logs").insert({
      user_id: userId,
      log_date: logDate,
      leg_pain: legPain,
      lower_back_pain: lowerBackPain,
      chest_pain: chestPain,
      shoulder_pain: shoulderPain,
      headache,
      pelvic_pain: pelvicPain,
      bowel_urination_pain: bowelUrinationPain,
      intercourse_pain: intercoursePain,
      bloating,
      nausea,
      diarrhea,
      constipation,
      fatigue,
      inflammation,
      mood,
      stress,
      inactivity,
      overexertion,
      coffee,
      alcohol,
      smoking,
      diet,
      sleep,
      cycle_phase: cyclePhase === "other" ? (cyclePhaseOther ? `other:${cyclePhaseOther}` : null) : (cyclePhase || null),
      notes: notes || null,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard/history");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center font-serif text-2xl font-semibold text-foreground">Log symptoms</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="log-date" className="mb-1 block text-sm font-medium text-foreground">
              Date
            </label>
            <input
              id="log-date"
              type="date"
              required
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            />
          </div>

          {/* Pain sliders */}
          <div className="space-y-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wide text-muted">Pain</h2>
            <Slider id="leg-pain" label="Leg" leftLabel="None" rightLabel="Severe" value={legPain} onChange={setLegPain} />
            <Slider id="lower-back-pain" label="Lower back" leftLabel="None" rightLabel="Severe" value={lowerBackPain} onChange={setLowerBackPain} />
            <Slider id="chest-pain" label="Chest" leftLabel="None" rightLabel="Severe" value={chestPain} onChange={setChestPain} />
            <Slider id="shoulder-pain" label="Shoulder" leftLabel="None" rightLabel="Severe" value={shoulderPain} onChange={setShoulderPain} />
            <Slider id="headache" label="Headache" leftLabel="None" rightLabel="Severe" value={headache} onChange={setHeadache} />
            <Slider id="pelvic-pain" label="Pelvic" leftLabel="None" rightLabel="Severe" value={pelvicPain} onChange={setPelvicPain} />
            <Slider id="bowel-urination-pain" label="Bowel/urination" leftLabel="None" rightLabel="Severe" value={bowelUrinationPain} onChange={setBowelUrinationPain} />
            <Slider id="intercourse-pain" label="Intercourse" leftLabel="None" rightLabel="Severe" value={intercoursePain} onChange={setIntercoursePain} />
          </div>

          {/* Other sliders */}
          <div className="space-y-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wide text-muted">Other symptoms</h2>
            <Slider id="bloating" label="Bloating" leftLabel="None" rightLabel="Severe" value={bloating} onChange={setBloating} />
            <Slider id="nausea" label="Nausea" leftLabel="None" rightLabel="Severe" value={nausea} onChange={setNausea} />
            <Slider id="diarrhea" label="Diarrhea" leftLabel="None" rightLabel="Severe" value={diarrhea} onChange={setDiarrhea} />
            <Slider id="constipation" label="Constipation" leftLabel="None" rightLabel="Severe" value={constipation} onChange={setConstipation} />
            <Slider id="fatigue" label="Fatigue" leftLabel="None" rightLabel="Exhausted" value={fatigue} onChange={setFatigue} />
            <Slider id="inflammation" label="Full body inflammation" leftLabel="None" rightLabel="Severe" value={inflammation} onChange={setInflammation} />
            <Slider id="mood" label="Mood" leftLabel="Normal" rightLabel="Depressive" value={mood} onChange={setMood} />
          </div>

          {/* Lifestyle factors */}
          <div className="space-y-4">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wide text-muted">Lifestyle factors</h2>
            <Slider id="stress" label="Stress & emotional health" leftLabel="None" rightLabel="Extreme" value={stress} onChange={setStress} />
            <Slider id="inactivity" label="Inactivity" leftLabel="None" rightLabel="Severe" value={inactivity} onChange={setInactivity} />
            <Slider id="overexertion" label="Overexertion" leftLabel="None" rightLabel="Severe" value={overexertion} onChange={setOverexertion} />
            <Slider id="coffee" label="Coffee intake" leftLabel="None" rightLabel="Heavy" value={coffee} onChange={setCoffee} />
            <Slider id="alcohol" label="Alcohol intake" leftLabel="None" rightLabel="Heavy" value={alcohol} onChange={setAlcohol} />
            <Slider id="smoking" label="Smoking" leftLabel="None" rightLabel="Heavy" value={smoking} onChange={setSmoking} />
            <Slider id="diet" label="Overall diet" leftLabel="Healthy" rightLabel="Poor" value={diet} onChange={setDiet} />
            <Slider id="sleep" label="Sleep" leftLabel="Normal" rightLabel="Poor" value={sleep} onChange={setSleep} />
          </div>

          {/* Cycle phase */}
          <div>
            <label htmlFor="cycle-phase" className="mb-1 block text-sm font-medium text-foreground">
              Menstrual cycle phase
            </label>
            <select
              id="cycle-phase"
              value={cyclePhase}
              onChange={(e) => setCyclePhase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            >
              <option value="">— Select —</option>
              <option value="menstrual">Menstrual phase (Day 1–5)</option>
              <option value="follicular">Follicular phase (Day 1–13)</option>
              <option value="ovulation">Ovulation (Day 14)</option>
              <option value="luteal">Luteal phase (Day 15–28)</option>
              <option value="on_pill">On the pill</option>
              <option value="other">Other</option>
            </select>
            {cyclePhase === "other" && (
              <input
                id="cycle-phase-other"
                type="text"
                placeholder="Please specify"
                value={cyclePhaseOther}
                onChange={(e) => setCyclePhaseOther(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-foreground">
              Other / notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
