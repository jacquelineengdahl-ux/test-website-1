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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
}

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

  // View/edit mode
  const [editing, setEditing] = useState(false);

  // Health overview state
  const [health, setHealth] = useState<HealthOverview | null>(null);

  // Letter state
  const [storyContent, setStoryContent] = useState("");
  const [storyDraft, setStoryDraft] = useState("");
  const [storySaving, setStorySaving] = useState(false);
  const [writingLetter, setWritingLetter] = useState(false);

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

      // Start in edit mode if welcome flow or no profile data
      const hasData = profile && (profile.name || profile.country || profile.diagnosis_date);
      if (isWelcome || !hasData) {
        setEditing(true);
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
  }, [router, isWelcome]);

  function handleOpenLetter() {
    setStoryDraft(storyContent);
    setWritingLetter(true);
  }

  async function handleSaveLetter() {
    if (!userId) return;
    setStorySaving(true);
    await supabase.from("endo_stories").upsert(
      { user_id: userId, content: storyDraft, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setStoryContent(storyDraft);
    setStorySaving(false);
    setWritingLetter(false);
  }

  function handleCancelLetter() {
    setStoryDraft("");
    setWritingLetter(false);
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

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(44, 40, 37);
    doc.text("My Endo Story", pageWidth / 2, 30, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(120, 113, 108);
    const meta = [name, new Date().toLocaleDateString()].filter(Boolean).join("  ·  ");
    if (meta) doc.text(meta, pageWidth / 2, 38, { align: "center" });

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
      setEditing(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const profileFields = [
    { label: "Date of birth", value: dateOfBirth ? formatDate(dateOfBirth) : null },
    { label: "Country", value: country || null },
    { label: "Diagnosis date", value: diagnosisDate ? formatDate(diagnosisDate) : null },
    { label: "First symptom", value: firstSymptomDate ? formatDate(firstSymptomDate) : null },
    { label: "Endo stage", value: endoStage || null },
  ];

  const hasAnyProfileData = name || profileFields.some((f) => f.value);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto w-full max-w-lg space-y-8 px-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          My Profile
        </h1>

        {isWelcome && (
          <div className="rounded-md border border-accent-green bg-green-50 px-4 py-3 text-center text-sm text-green-800">
            <p className="font-medium">Welcome! Let&apos;s set up your profile first.</p>
            <p className="mt-1 text-green-700">Fill in your details below, then head to the dashboard to log your first entry.</p>
          </div>
        )}

        {/* ── Profile Card ── */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {editing ? (
            /* ── Edit Mode ── */
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Edit Profile</h2>
                {hasAnyProfileData && !isWelcome && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Avatar */}
              <div className="mb-5 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-background hover:opacity-80 disabled:opacity-50"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="date-of-birth" className="mb-1 block text-sm font-medium text-foreground">Date of birth</label>
                  <input
                    id="date-of-birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="mb-1 block text-sm font-medium text-foreground">Country</label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Your country"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="diagnosis-date" className="mb-1 block text-sm font-medium text-foreground">Diagnosis date</label>
                  <input
                    id="diagnosis-date"
                    type="date"
                    value={diagnosisDate}
                    onChange={(e) => setDiagnosisDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="first-symptom-date" className="mb-1 block text-sm font-medium text-foreground">Date of first symptom</label>
                  <input
                    id="first-symptom-date"
                    type="date"
                    value={firstSymptomDate}
                    onChange={(e) => setFirstSymptomDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="endo-stage" className="mb-1 block text-sm font-medium text-foreground">Endo stage</label>
                  <select
                    id="endo-stage"
                    value={endoStage}
                    onChange={(e) => setEndoStage(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
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
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </form>
            </>
          ) : (
            /* ── View Mode ── */
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted">
                        {name ? name[0].toUpperCase() : "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-xl font-semibold text-foreground">
                      {name || "No name set"}
                    </p>
                    {country && <p className="text-sm text-muted">{country}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
                >
                  Edit
                </button>
              </div>

              {/* Profile details */}
              {profileFields.some((f) => f.value) && (
                <div className="mt-5 space-y-2.5 border-t border-border pt-5">
                  {profileFields.map((field) =>
                    field.value ? (
                      <div key={field.label} className="flex justify-between text-sm">
                        <span className="text-muted">{field.label}</span>
                        <span className="font-medium text-foreground">{field.value}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── My Letter ── */}
        {writingLetter ? (
          /* Writing mode */
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                My Letter
              </h2>
              <button
                type="button"
                onClick={handleCancelLetter}
                className="text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <textarea
              rows={12}
              value={storyDraft}
              onChange={(e) => setStoryDraft(e.target.value)}
              placeholder="Start writing your story..."
              autoFocus
              className="w-full rounded-md border border-border bg-background px-4 py-3 font-serif text-foreground text-sm leading-relaxed resize-y"
            />

            <button
              type="button"
              onClick={handleSaveLetter}
              disabled={storySaving}
              className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {storySaving ? "Saving..." : "Save letter"}
            </button>
          </div>
        ) : storyContent ? (
          /* Saved letter view */
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                My Letter
              </h2>
              <button
                type="button"
                onClick={handleOpenLetter}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
              >
                Edit
              </button>
            </div>
            <div className="mx-6 mb-5 rounded-md border border-border bg-background px-5 py-4">
              <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
                {storyContent}
              </p>
            </div>
            <div className="border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
              >
                Download as PDF
              </button>
            </div>
          </div>
        ) : (
          /* Empty state — CTA */
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4 text-center">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
              My Letter
            </h2>
            <p className="text-sm text-muted">
              Write a personal letter about your journey. Share it with loved ones or healthcare providers.
            </p>
            <button
              type="button"
              onClick={handleOpenLetter}
              className="rounded-md bg-accent-green px-5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Write a letter about your Endometriosis journey
            </button>
            <ul className="space-y-1 text-left text-sm text-muted list-disc pl-5 pt-1">
              <li>When did you first notice something wasn&apos;t right?</li>
              <li>What has your journey to diagnosis looked like?</li>
              <li>What are your symptoms?</li>
              <li>What treatments have you tried and consider trying? How do they feel?</li>
              <li>How has endo affected your daily life?</li>
              <li>What do you wish people understood about living with endometriosis?</li>
              <li>What gives you strength on difficult days?</li>
              <li>Reflections &amp; lessons from your Endometriosis journey</li>
            </ul>
          </div>
        )}

        {/* ── Health Overview ── */}
        {health && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Health Overview
            </h2>

            {health.totalEntries === 0 ? (
              <div className="space-y-3 py-2 text-center">
                <p className="text-sm text-muted">
                  No symptom logs yet. Start logging to see your health trends.
                </p>
                <a
                  href="/dashboard/log"
                  className="inline-block rounded-md bg-accent-green px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Log your first entry
                </a>
              </div>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total entries</span>
                  <span className="font-medium text-foreground">{health.totalEntries}</span>
                </div>
                {health.firstLogDate && (
                  <div className="flex justify-between">
                    <span className="text-muted">First log</span>
                    <span className="font-medium text-foreground">{formatDate(health.firstLogDate)}</span>
                  </div>
                )}
                {health.lastLogDate && (
                  <div className="flex justify-between">
                    <span className="text-muted">Most recent log</span>
                    <span className="font-medium text-foreground">{formatDate(health.lastLogDate)}</span>
                  </div>
                )}
                {health.topSymptoms.length > 0 && (
                  <>
                    <hr className="border-border" />
                    <p className="font-medium text-foreground">Top symptoms</p>
                    {health.topSymptoms.map((s) => (
                      <div key={s.label} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted">{s.label}</span>
                          <span className="font-medium text-foreground">{s.avg.toFixed(1)} avg</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border">
                          <div
                            className="h-1.5 rounded-full bg-accent-green"
                            style={{ width: `${(s.avg / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
