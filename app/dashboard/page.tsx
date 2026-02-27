"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [hasLogs, setHasLogs] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        supabase
          .from("symptom_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id)
          .then(({ count }) => setHasLogs((count ?? 0) > 0));
      }
    });
  }, []);

  if (hasLogs === null) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-24">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      {hasLogs ? (
        <>
          {email && <p className="text-muted">Welcome back, {email}</p>}
          <div className="flex gap-4">
            <a
              href="/dashboard/log"
              className="rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Log symptoms
            </a>
            <a
              href="/dashboard/history"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              View history
            </a>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-md space-y-4 rounded-md border border-border bg-surface px-8 py-10 text-center">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Welcome to Living with Endo
          </h2>
          <p className="text-sm text-muted">
            Start tracking your symptoms to discover patterns and take control of your health.
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
  );
}
