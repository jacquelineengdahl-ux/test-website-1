"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
}

function calcAge(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function timeToDiagnosis(symptomDate: string, diagDate: string): string | null {
  if (!symptomDate || !diagDate) return null;
  const s = new Date(symptomDate + "T00:00:00");
  const d = new Date(diagDate + "T00:00:00");
  if (d <= s) return null;
  let years = d.getFullYear() - s.getFullYear();
  let months = d.getMonth() - s.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (d.getDate() < s.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return parts.length > 0 ? parts.join(", ") : "Less than a month";
}

interface Provider {
  clinic: string;
  name: string;
  contact: string;
}

const GOAL_PROMPTS = [
  "What symptoms do you most want to manage or reduce?",
  "Are there any treatments or therapies you'd like to explore?",
  "What lifestyle changes could support your wellbeing?",
  "Is there any additional clinic you want to contact?",
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Personal info state
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Endo state
  const [firstSymptomDate, setFirstSymptomDate] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [endoStage, setEndoStage] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [supportingTreatment, setSupportingTreatment] = useState("");
  const [healthcareProviders, setHealthcareProviders] = useState<Provider[]>([]);
  const [treatmentGoals, setTreatmentGoals] = useState<string[]>([]);

  // Edit modes
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingEndo, setEditingEndo] = useState(false);

  // Save / error
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingEndo, setSavingEndo] = useState(false);
  const [error, setError] = useState("");

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
      setEmail(data.user.email ?? "");

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setName(profile.name ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");
        setMobileNumber(profile.mobile_number ?? "");
        setCountry(profile.country ?? "");
        setFirstSymptomDate(profile.first_symptom_date ?? "");
        setDiagnosisDate(profile.diagnosis_date ?? "");
        setEndoStage(profile.endo_stage ?? "");
        setTreatmentPlan(profile.treatment_plan ?? "");
        setSupportingTreatment(profile.supporting_treatment ?? "");
        setHealthcareProviders(profile.healthcare_providers ?? []);
        setTreatmentGoals(profile.treatment_goals ?? []);
        setAvatarUrl(profile.avatar_url ?? "");
      }

      // Start in edit mode if welcome flow or no profile data
      const hasData = profile && (profile.name || profile.country || profile.diagnosis_date);
      if (isWelcome || !hasData) {
        setEditingPersonal(true);
        setEditingEndo(true);
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

      setLoading(false);
    }

    init();
  }, [router, isWelcome]);

  // ── Avatar upload ──
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

  // ── Save personal info ──
  async function handleSavePersonal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingPersonal(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      name: name || null,
      date_of_birth: dateOfBirth || null,
      mobile_number: mobileNumber || null,
      country: country || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    });

    setSavingPersonal(false);
    if (upsertError) {
      setError(upsertError.message);
    } else if (isWelcome && !editingEndo) {
      router.push("/dashboard");
    } else {
      setEditingPersonal(false);
    }
  }

  // ── Save endo info ──
  async function handleSaveEndo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingEndo(true);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      first_symptom_date: firstSymptomDate || null,
      diagnosis_date: diagnosisDate || null,
      endo_stage: endoStage || null,
      treatment_plan: treatmentPlan || null,
      supporting_treatment: supportingTreatment || null,
      healthcare_providers: healthcareProviders,
      treatment_goals: treatmentGoals.filter((g) => g.trim() !== ""),
      updated_at: new Date().toISOString(),
    });

    setSavingEndo(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setTreatmentGoals(treatmentGoals.filter((g) => g.trim() !== ""));
      if (isWelcome && !editingPersonal) {
        router.push("/dashboard");
      } else {
        setEditingEndo(false);
      }
    }
  }

  // ── Healthcare providers helpers ──
  function addProvider() {
    setHealthcareProviders([...healthcareProviders, { clinic: "", name: "", contact: "" }]);
  }

  function updateProvider(index: number, field: keyof Provider, value: string) {
    const updated = [...healthcareProviders];
    updated[index] = { ...updated[index], [field]: value };
    setHealthcareProviders(updated);
  }

  function removeProvider(index: number) {
    setHealthcareProviders(healthcareProviders.filter((_, i) => i !== index));
  }

  // ── Goal helpers ──
  function addGoal() {
    setTreatmentGoals([...treatmentGoals, ""]);
  }

  function updateGoal(index: number, value: string) {
    const updated = [...treatmentGoals];
    updated[index] = value;
    setTreatmentGoals(updated);
  }

  function removeGoal(index: number) {
    setTreatmentGoals(treatmentGoals.filter((_, i) => i !== index));
  }

  // ── Letter handlers ──
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

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const age = calcAge(dateOfBirth);

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

        {/* ── Large Photo (top, centered) ── */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-border bg-background">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted">
                {name ? name[0].toUpperCase() : "?"}
              </span>
            )}
          </div>
          {name && (
            <p className="font-serif text-xl font-semibold text-foreground">{name}</p>
          )}
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

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        {/* ── Personal Info Card ── */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {editingPersonal ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Personal Info</h2>
                {!isWelcome && (
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(false)}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSavePersonal} className="space-y-3">
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
                  <label htmlFor="mobile-number" className="mb-1 block text-sm font-medium text-foreground">Mobile number</label>
                  <input
                    id="mobile-number"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Your mobile number"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                  <p className="rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-muted">{email}</p>
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
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingPersonal ? "Saving..." : "Save"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Personal Info</h2>
                <button
                  type="button"
                  onClick={() => setEditingPersonal(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
                >
                  Edit
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                <ViewRow label="Name" value={name || null} />
                <ViewRow
                  label="Date of birth"
                  value={dateOfBirth ? `${formatDate(dateOfBirth)}${age !== null ? ` (${age} years old)` : ""}` : null}
                />
                <ViewRow label="Mobile number" value={mobileNumber || null} />
                <ViewRow label="Email" value={email || null} />
                <ViewRow label="Country" value={country || null} />
              </div>
            </>
          )}
        </div>

        {/* ── Endometriosis Card ── */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {editingEndo ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Endometriosis</h2>
                {!isWelcome && (
                  <button
                    type="button"
                    onClick={() => setEditingEndo(false)}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveEndo} className="space-y-3">
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
                  <label htmlFor="diagnosis-date" className="mb-1 block text-sm font-medium text-foreground">Date of diagnosis</label>
                  <input
                    id="diagnosis-date"
                    type="date"
                    value={diagnosisDate}
                    onChange={(e) => setDiagnosisDate(e.target.value)}
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
                <div>
                  <label htmlFor="treatment-plan" className="mb-1 block text-sm font-medium text-foreground">Medical Treatment Plan</label>
                  <ul className="mb-2 space-y-0.5 text-sm text-muted list-disc pl-5">
                    <li>Current medications and dosages</li>
                    <li>Hormonal treatments (e.g. the pill, GnRH agonists)</li>
                    <li>Surgical history or upcoming procedures</li>
                    <li>Pain management prescribed by your doctor</li>
                  </ul>
                  <textarea
                    id="treatment-plan"
                    rows={3}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="Describe your current medical treatment..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground resize-y"
                  />
                </div>
                <div>
                  <label htmlFor="supporting-treatment" className="mb-1 block text-sm font-medium text-foreground">Supporting Treatment</label>
                  <ul className="mb-2 space-y-0.5 text-sm text-muted list-disc pl-5">
                    <li>Supplements you are taking or considering</li>
                    <li>Dietary changes (e.g. anti-inflammatory, gluten-free)</li>
                    <li>Lifestyle practices (e.g. exercise, sleep, stress management)</li>
                    <li>Alternative therapies (e.g. acupuncture, physiotherapy, yoga)</li>
                  </ul>
                  <textarea
                    id="supporting-treatment"
                    rows={3}
                    value={supportingTreatment}
                    onChange={(e) => setSupportingTreatment(e.target.value)}
                    placeholder="Describe any supporting treatments..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground resize-y"
                  />
                </div>

                {/* Healthcare providers */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Healthcare providers</label>
                  <div className="space-y-2">
                    {healthcareProviders.map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={p.clinic}
                            onChange={(e) => updateProvider(i, "clinic", e.target.value)}
                            placeholder="Name of clinic"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                          />
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateProvider(i, "name", e.target.value)}
                            placeholder="Name of doctor"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                          />
                          <input
                            type="text"
                            value={p.contact}
                            onChange={(e) => updateProvider(i, "contact", e.target.value)}
                            placeholder="Contact details"
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProvider(i)}
                          className="mt-1 shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-red-600 hover:border-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addProvider}
                    className="mt-2 text-sm text-accent-green hover:underline"
                  >
                    + Add provider
                  </button>
                </div>

                {/* Goals */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Personal Goals &amp; Next Steps in Treatment</label>
                  <ul className="mb-3 space-y-0.5 text-sm text-muted list-disc pl-5">
                    {GOAL_PROMPTS.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    {treatmentGoals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g}
                          onChange={(e) => updateGoal(i, e.target.value)}
                          placeholder="Enter a goal or next step..."
                          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => removeGoal(i)}
                          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-red-600 hover:border-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addGoal}
                    className="mt-2 text-sm text-accent-green hover:underline"
                  >
                    + Add goal
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={savingEndo}
                  className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingEndo ? "Saving..." : "Save"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">Endometriosis</h2>
                <button
                  type="button"
                  onClick={() => setEditingEndo(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
                >
                  Edit
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                <ViewRow label="Date of first symptom" value={firstSymptomDate ? formatDate(firstSymptomDate) : null} />
                <ViewRow label="Date of diagnosis" value={diagnosisDate ? formatDate(diagnosisDate) : null} />
                <ViewRow label="Time to diagnosis" value={timeToDiagnosis(firstSymptomDate, diagnosisDate)} />
                <ViewRow label="Endo stage" value={endoStage || null} />
                {treatmentPlan && (
                  <div className="pt-1">
                    <p className="text-sm text-muted">Medical Treatment Plan</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{treatmentPlan}</p>
                  </div>
                )}
                {supportingTreatment && (
                  <div className="pt-1">
                    <p className="text-sm text-muted">Supporting Treatment</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{supportingTreatment}</p>
                  </div>
                )}
                {healthcareProviders.length > 0 && (
                  <div className="pt-1">
                    <p className="mb-2 text-sm text-muted">Healthcare providers</p>
                    <div className="space-y-2">
                      {healthcareProviders.map((p, i) => (
                        <div key={i} className="rounded-lg border border-border bg-background px-4 py-3">
                          {p.clinic && (
                            <p className="font-medium text-sm text-foreground">{p.clinic}</p>
                          )}
                          {p.name && (
                            <p className="text-sm text-foreground">{p.name}</p>
                          )}
                          {p.contact && (
                            <p className="text-sm text-muted">{p.contact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {treatmentGoals.length > 0 && (
                  <div className="pt-1">
                    <p className="mb-2 text-sm text-muted">Personal Goals &amp; Next Steps in Treatment</p>
                    <div className="space-y-2">
                      {treatmentGoals.map((g, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-green text-white text-xs">&#10003;</span>
                          <p className="text-sm text-foreground">{g}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

      </div>
    </div>
  );
}

/* ── Reusable view-mode row ── */
function ViewRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
