"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [biggestStruggle, setBiggestStruggle] = useState("");
  const [wishedTools, setWishedTools] = useState("");
  const [willingnessToPay, setWillingnessToPay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.from("waitlist").insert({
      email,
      biggest_struggle: biggestStruggle || null,
      wished_tools: wishedTools || null,
      willingness_to_pay: willingnessToPay || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSubmitted(true);
    }
  }

  const payOptions = [
    "Free",
    "$5–10/mo",
    "$10–20/mo",
    "$20–30/mo",
    "$30+/mo",
  ];

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 px-4 text-center">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Thank you!
          </h1>
          <p className="text-muted">
            You&apos;re on the list. We&apos;ll be in touch when Living with Endo is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 px-4 py-12">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            Living with Endo
          </h1>
          <p className="text-muted">
            A thoughtful tracking tool for women with endometriosis — coming
            soon. Join the waitlist to get early access and help shape what we
            build.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="struggle" className="mb-1 block text-sm font-medium text-foreground">
              What&apos;s your biggest endo struggle right now?
            </label>
            <textarea
              id="struggle"
              rows={3}
              value={biggestStruggle}
              onChange={(e) => setBiggestStruggle(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="tools" className="mb-1 block text-sm font-medium text-foreground">
              What tools do you wish existed?
            </label>
            <textarea
              id="tools"
              rows={3}
              value={wishedTools}
              onChange={(e) => setWishedTools(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              What would you be willing to pay for an online endo tool?
            </legend>
            <div className="space-y-2">
              {payOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="willingness_to_pay"
                    value={option}
                    checked={willingnessToPay === option}
                    onChange={(e) => setWillingnessToPay(e.target.value)}
                    className="accent-accent-green"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-green py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Joining…" : "Join the waitlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
