"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState("");
const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [endoStage, setEndoStage] = useState("");
  const [firstSymptomDate, setFirstSymptomDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Health overview state
  const [health, setHealth] = useState<HealthOverview | null>(null);

  // Story state
  const [storyContent, setStoryContent] = useState("");
  const [storySaving, setStorySaving] = useState(false);
  const [storySaved, setStorySaved] = useState(true);
  const storyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setFirstSymptomDate(profile.first_symptom_date ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
      }

      // Load story
      const { data: story } = await supabase
        .from("endo_stories")
        .select("content")
        .eq("user_id", uid)
        .maybeSingle();

      if (story) {
        setStoryContent(story.content ?? "");
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

  // Cleanup story debounce timer
  useEffect(() => {
    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, []);

  function handleStoryChange(value: string) {
    setStoryContent(value);
    setStorySaved(false);

    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);

    storyTimerRef.current = setTimeout(async () => {
      if (!userId) return;
      setStorySaving(true);
      await supabase.from("endo_stories").upsert(
        { user_id: userId, content: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      setStorySaving(false);
      setStorySaved(true);
    }, 2000);
  }

  async function handleDownloadPdf() {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;

    function addFooter() {
      doc.setFontSize(9);
      doc.setTextColor(120, 113, 108);
      doc.text("Living with Endo", pageWidth / 2, pageHeight - 12, { align: "center" });
    }

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(44, 40, 37);
    doc.text("My Endo Story", pageWidth / 2, 30, { align: "center" });

    // Author & date
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);
    const meta = [name, new Date().toLocaleDateString()].filter(Boolean).join("  ·  ");
    if (meta) doc.text(meta, pageWidth / 2, 38, { align: "center" });

    // Body text
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(44, 40, 37);

    const lines = doc.splitTextToSize(storyContent || "(No story written yet.)", usableWidth);
    let y = 50;

    for (const line of lines) {
      if (y > pageHeight - 25) {
        addFooter();
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    addFooter();
    doc.save("my-endo-story.pdf");
  }

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
      first_symptom_date: firstSymptomDate || null,
      endo_stage: endoStage || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else if (isWelcome) {
      router.push("/dashboard");
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
        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
          My Profile
        </h1>

        {isWelcome && (
          <div className="rounded-md border border-accent-green bg-green-50 px-4 py-3 text-center text-sm text-green-800">
            <p className="font-medium">Welcome! Let&apos;s set up your profile first.</p>
            <p className="mt-1 text-green-700">Fill in your details below, then head to the dashboard to log your first entry.</p>
          </div>
        )}

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
              <label htmlFor="first-symptom-date" className="mb-1 block text-sm font-medium text-foreground">
                Date of first symptom
              </label>
              <input
                id="first-symptom-date"
                type="date"
                value={firstSymptomDate}
                onChange={(e) => setFirstSymptomDate(e.target.value)}
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

        {/* My Endo Story */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">
            My Endo Story
          </h2>
          <p className="text-sm text-muted">
            A private space to write your story. Share it with loved ones or healthcare providers by downloading as a PDF.
          </p>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted hover:text-foreground">
              Writing prompts to get started
            </summary>
            <ul className="mt-2 space-y-1 pl-4 text-muted list-disc">
              <li>When did you first notice something wasn&apos;t right?</li>
              <li>What has your journey to diagnosis looked like?</li>
              <li>How has endo affected your daily life?</li>
              <li>What do you wish people understood about living with endo?</li>
              <li>What gives you strength on difficult days?</li>
            </ul>
          </details>

          <textarea
            rows={10}
            value={storyContent}
            onChange={(e) => handleStoryChange(e.target.value)}
            placeholder="Start writing your story..."
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground text-sm leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {storySaving
                ? "Saving..."
                : storySaved
                  ? "All changes saved"
                  : "Unsaved changes"}
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
            >
              Download as PDF
            </button>
          </div>
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
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted">
                    No symptom logs yet. Start logging to see your health trends and top symptoms.
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
          </div>
        )}
      </div>
    </div>
  );
}
