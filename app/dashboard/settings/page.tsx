"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("reset") === "1";
  const passwordSectionRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");
  const [isEmailUser, setIsEmailUser] = useState(false);

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isReset && passwordSectionRef.current) {
      passwordSectionRef.current.scrollIntoView({ behavior: "smooth" });
      const input = passwordSectionRef.current.querySelector("input");
      input?.focus();
    }
  }, [isReset, isEmailUser]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        const prov = data.user.app_metadata?.provider ?? "email";
        setProvider(prov);
        setIsEmailUser(prov === "email");
      }
    });
  }, []);

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
      await supabase.from("endo_stories").delete().eq("user_id", data.user.id);
    }
    await supabase.auth.signOut();
    localStorage.clear();
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-sm space-y-10 px-4">
        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>

        {isReset && (
          <div className="rounded-md border border-accent-green bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800">
            Set your new password below
          </div>
        )}

        {/* Profile link */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Profile</h2>
          <a
            href="/profile"
            className="inline-block text-sm font-medium text-accent-green hover:opacity-80"
          >
            Manage your profile &rarr;
          </a>
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
          <div ref={passwordSectionRef} className="space-y-3">
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

        {/* Your data */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-muted">Your data</h2>
          <p className="text-sm text-muted">
            Download all your symptom log data as a CSV file.
          </p>
          <button
            type="button"
            onClick={async () => {
              const { data: userData } = await supabase.auth.getUser();
              if (!userData.user) return;

              const { data: logs } = await supabase
                .from("symptom_logs")
                .select("*")
                .eq("user_id", userData.user.id)
                .order("date", { ascending: true });

              if (!logs || logs.length === 0) {
                alert("No symptom log data to export.");
                return;
              }

              const headers = Object.keys(logs[0]);
              const csvRows = [
                headers.join(","),
                ...logs.map((row) =>
                  headers
                    .map((h) => {
                      const val = row[h];
                      if (val === null || val === undefined) return "";
                      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
                      return `"${str.replace(/"/g, '""')}"`;
                    })
                    .join(",")
                ),
              ];

              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "livingwithendo-data.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full rounded-md border border-border py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Export data
          </button>
        </div>

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

        {/* Legal links */}
        <div className="flex justify-center gap-4 pt-4 text-sm">
          <a href="/privacy" className="text-accent-green underline hover:opacity-80">
            Privacy Policy
          </a>
          <a href="/terms" className="text-accent-green underline hover:opacity-80">
            Terms of Use
          </a>
        </div>
      </div>
    </div>
  );
}
