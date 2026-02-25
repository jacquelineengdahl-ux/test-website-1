"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email ?? "");
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-24">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      {email && <p className="text-muted">Welcome, {email}</p>}
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
    </div>
  );
}
