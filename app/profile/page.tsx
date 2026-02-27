"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  { key: "coffee", label: "Coffee intake" },
  { key: "alcohol", label: "Alcohol intake" },
  { key: "smoking", label: "Smoking" },
  { key: "diet", label: "Diet" },
  { key: "sleep", label: "Sleep" },
] as const;

type HealthOverview = {
  totalEntries: number;
  firstLogDate: string | null;
  lastLogDate: string | null;
  topSymptoms: { label: string; avg: number }[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState("");
const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [endoStage, setEndoStage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Health overview state
  const [health, setHealth] = useState<HealthOverview | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }

      const uid = data.user.id;
      setUserId(uid);

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setName(profile.name ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");
        setCountry(profile.country ?? "");
        setDiagnosisDate(profile.diagnosis_date ?? "");
        setEndoStage(profile.endo_stage ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }

      // Load health overview
      const { count } = await supabase
        .from("symptom_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid);

      const totalEntries = count ?? 0;

      let firstLogDate: string | null = null;
      let lastLogDate: string | null = null;
      let topSymptoms: { label: string; avg: number }[] = [];

      if (totalEntries > 0) {
        const { data: firstRow } = await supabase
          .from("symptom_logs")
          .select("log_date")
          .eq("user_id", uid)
          .order("log_date", { ascending: true })
          .limit(1)
          .single();

        const { data: lastRow } = await supabase
          .from("symptom_logs")
          .select("log_date")
          .eq("user_id", uid)
          .order("log_date", { ascending: false })
          .limit(1)
          .single();

        firstLogDate = firstRow?.log_date ?? null;
        lastLogDate = lastRow?.log_date ?? null;

        // Fetch all logs to compute averages
        const { data: logs } = await supabase
          .from("symptom_logs")
          .select(SYMPTOM_FIELDS.map((f) => f.key).join(","))
          .eq("user_id", uid);

        if (logs && logs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rows = logs as any[];
          const averages = SYMPTOM_FIELDS.map((field) => {
            const sum = rows.reduce(
              (acc: number, log) => acc + (Number(log[field.key]) || 0),
              0
            );
            return { label: field.label, avg: sum / rows.length };
          })
            .filter((s) => s.avg > 0)
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);

          topSymptoms = averages;
        }
      }

      setHealth({ totalEntries, firstLogDate, lastLogDate, topSymptoms });
      setLoading(false);
    }

    init();
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);

    await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: url, updated_at: new Date().toISOString() });

    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      name: name || null,
      date_of_birth: dateOfBirth || null,
      country: country || null,
      diagnosis_date: diagnosisDate || null,
      endo_stage: endoStage || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSuccess("Profile saved.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto w-full max-w-sm space-y-10 px-4">
        <a href="/dashboard" className="text-sm text-muted hover:text-foreground">
          &larr; Back to dashboard
        </a>

        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
          My Profile
        </h1>

        {/* Profile form */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Profile</h2>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-surface hover:opacity-80 disabled:opacity-50"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted">
                  {name ? name[0].toUpperCase() : "?"}
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-muted hover:text-foreground disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>
<div>
              <label htmlFor="date-of-birth" className="mb-1 block text-sm font-medium text-foreground">
                Date of birth
              </label>
              <input
                id="date-of-birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-foreground">
                Country
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Your country"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="diagnosis-date" className="mb-1 block text-sm font-medium text-foreground">
                Diagnosis date
              </label>
              <input
                id="diagnosis-date"
                type="date"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="endo-stage" className="mb-1 block text-sm font-medium text-foreground">
                Endo stage
              </label>
              <select
                id="endo-stage"
                value={endoStage}
                onChange={(e) => setEndoStage(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              >
                <option value="">Select...</option>
                <option value="Stage I">Stage I</option>
                <option value="Stage II">Stage II</option>
                <option value="Stage III">Stage III</option>
                <option value="Stage IV">Stage IV</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>

        {/* Health overview */}
        {health && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">
              Health overview
            </h2>
            <div className="space-y-2 rounded-md border border-border bg-surface px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total entries logged</span>
                <span className="text-foreground">{health.totalEntries}</span>
              </div>
              {health.firstLogDate && (
                <div className="flex justify-between">
                  <span className="text-muted">First log date</span>
                  <span className="text-foreground">{health.firstLogDate}</span>
                </div>
              )}
              {health.lastLogDate && (
                <div className="flex justify-between">
                  <span className="text-muted">Most recent log date</span>
                  <span className="text-foreground">{health.lastLogDate}</span>
                </div>
              )}
              {health.topSymptoms.length > 0 && (
                <>
                  <hr className="border-border" />
                  <p className="font-medium text-foreground">Top symptoms</p>
                  {health.topSymptoms.map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span className="text-muted">{s.label}</span>
                      <span className="text-foreground">{s.avg.toFixed(1)} avg</span>
                    </div>
                  ))}
                </>
              )}
              {health.totalEntries === 0 && (
                <p className="text-muted">No symptom logs yet. Start logging to see your health overview.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
