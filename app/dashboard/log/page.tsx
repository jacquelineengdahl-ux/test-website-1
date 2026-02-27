"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function LogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(!!editId);
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
  const [cyclePhases, setCyclePhases] = useState<string[]>([]);
  const [cyclePhaseOther, setCyclePhaseOther] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);

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
        setIntercoursePain(entry.intercourse_pain);
        setBloating(entry.bloating);
        setNausea(entry.nausea);
        setDiarrhea(entry.diarrhea);
        setConstipation(entry.constipation);
        setFatigue(entry.fatigue);
        setInflammation(entry.inflammation);
        setMood(entry.mood);
        setStress(entry.stress);
        setInactivity(entry.inactivity);
        setOverexertion(entry.overexertion);
        setCoffee(entry.coffee);
        setAlcohol(entry.alcohol);
        setSmoking(entry.smoking);
        setDiet(entry.diet);
        setSleep(entry.sleep);
        setNotes(entry.notes ?? "");

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
      notes: notes || null,
    };

    const result = editId
      ? await supabase.from("symptom_logs").update(payload).eq("id", editId)
      : await supabase.from("symptom_logs").insert(payload);

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      router.push("/dashboard/history");
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
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
          {editId ? "Edit entry" : "Log symptoms"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-16">
          <div>
            <label htmlFor="log-date" className="mb-1 block font-serif text-lg font-semibold tracking-tight text-muted">
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
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Pain levels</h2>
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
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Other symptoms</h2>
            <Slider id="bloating" label="Bloating" leftLabel="None" rightLabel="Severe" value={bloating} onChange={setBloating} />
            <Slider id="nausea" label="Nausea" leftLabel="None" rightLabel="Severe" value={nausea} onChange={setNausea} />
            <Slider id="diarrhea" label="Diarrhea" leftLabel="None" rightLabel="Severe" value={diarrhea} onChange={setDiarrhea} />
            <Slider id="constipation" label="Constipation" leftLabel="None" rightLabel="Severe" value={constipation} onChange={setConstipation} />
            <Slider id="fatigue" label="Fatigue" leftLabel="None" rightLabel="Exhausted" value={fatigue} onChange={setFatigue} />
            <Slider id="inflammation" label="Full body inflammation" leftLabel="None" rightLabel="Severe" value={inflammation} onChange={setInflammation} />
            <Slider id="mood" label="Mood" leftLabel="Normal" rightLabel="Depressive" value={mood} onChange={setMood} />
          </div>

          {/* Lifestyle factors */}
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Lifestyle factors</h2>
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
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Menstrual cycle phase</h2>
            {[
              { value: "menstrual", label: "Menstrual phase (Day 1–5)" },
              { value: "follicular", label: "Follicular phase (Day 1–13)" },
              { value: "ovulation", label: "Ovulation (Day 14)" },
              { value: "luteal", label: "Luteal phase (Day 15–28)" },
              { value: "on_pill", label: "On the pill" },
              { value: "other", label: "Other" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={cyclePhases.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCyclePhases([...cyclePhases, option.value]);
                    } else {
                      setCyclePhases(cyclePhases.filter((p) => p !== option.value));
                    }
                  }}
                  className="accent-accent-green"
                />
                {option.label}
              </label>
            ))}
            {cyclePhases.includes("other") && (
              <input
                type="text"
                placeholder="Please specify"
                value={cyclePhaseOther}
                onChange={(e) => setCyclePhaseOther(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block font-serif text-lg font-semibold tracking-tight text-muted">
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
