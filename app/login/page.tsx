"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="font-serif text-xl font-semibold text-foreground">
          Living with Endo
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-foreground px-5 py-2 text-sm font-medium text-foreground transition-all hover:bg-foreground hover:text-surface"
        >
          Sign up
        </Link>
      </nav>

      {/* Main */}
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-10 text-center">
            <p className="section-label mb-3">Welcome Back</p>
            <h1 className="font-serif text-4xl font-light text-foreground">Log in</h1>
            <p className="mt-3 text-sm text-muted">
              Continue tracking your endometriosis journey
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground transition-colors focus:border-accent-green focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground transition-colors focus:border-accent-green focus:outline-none"
                  placeholder="Your password"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-foreground py-3 text-base font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>

            <div className="mt-5 text-center">
              {resetSent ? (
                <p className="text-sm text-accent-green">Password reset email sent. Check your inbox.</p>
              ) : (
                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={async () => {
                    if (!email) {
                      setError("Enter your email above, then click Forgot password.");
                      return;
                    }
                    setError("");
                    setResetLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    });
                    setResetLoading(false);
                    if (error) {
                      setError(error.message);
                    } else {
                      setResetSent(true);
                    }
                  }}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {resetLoading ? "Sending…" : "Forgot password?"}
                </button>
              )}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-surface py-3 text-sm font-medium text-foreground transition-all hover:bg-background hover:shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer links */}
          <p className="mt-8 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-2">
              Sign up
            </Link>
          </p>

          <div className="mt-4 flex justify-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
