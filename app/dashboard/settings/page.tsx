"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");
  const [isEmailUser, setIsEmailUser] = useState(false);

  // Profile state
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [endoStage, setEndoStage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        const prov = data.user.app_metadata?.provider ?? "email";
        setProvider(prov);
        setIsEmailUser(prov === "email");

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile) {
          setName(profile.name ?? "");
          setDateOfBirth(profile.date_of_birth ?? "");
          setDiagnosisDate(profile.diagnosis_date ?? "");
          setEndoStage(profile.endo_stage ?? "");
        }
        setProfileLoading(false);
      }
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setProfileError("Not authenticated.");
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name: name || null,
      date_of_birth: dateOfBirth || null,
      diagnosis_date: diagnosisDate || null,
      endo_stage: endoStage || null,
      updated_at: new Date().toISOString(),
    });

    setSavingProfile(false);
    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSuccess("Profile saved.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account? All your data will be permanently removed.")) {
      return;
    }

    setDeleting(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").delete().eq("id", data.user.id);
      await supabase.from("symptom_logs").delete().eq("user_id", data.user.id);
    }
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-sm space-y-10 px-4">
        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>

        {/* Profile */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Profile</h2>
          {profileLoading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3">
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
              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-green-700">{profileSuccess}</p>}
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}
        </div>

        {/* Account info */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Account</h2>
          <div className="space-y-2 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Email</span>
              <span className="text-foreground">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Sign-in method</span>
              <span className="text-foreground capitalize">{provider === "email" ? "Email & password" : provider}</span>
            </div>
          </div>
        </div>

        {/* Change password (email users only) */}
        {isEmailUser && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-foreground">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-foreground">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
                />
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-700">{passwordSuccess}</p>}
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingPassword ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        )}

        {/* Danger zone */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-red-600">Danger zone</h2>
          <div className="rounded-md border border-red-200 px-4 py-4">
            <p className="mb-3 text-sm text-muted">
              This will permanently delete all your symptom logs and sign you out.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full rounded-md border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
