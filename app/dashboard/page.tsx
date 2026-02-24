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
    <div className="flex flex-col items-center justify-center py-24 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {email && <p>Welcome, {email}</p>}
      <div className="flex gap-4">
        <a
          href="/dashboard/log"
          className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Log symptoms
        </a>
        <a
          href="/dashboard/history"
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-foreground hover:text-background"
        >
          View history
        </a>
      </div>
    </div>
  );
}
