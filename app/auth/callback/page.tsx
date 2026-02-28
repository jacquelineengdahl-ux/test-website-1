"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      // Check for error in URL (e.g. access_denied from Google)
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlError = params.get("error") || hashParams.get("error");
      const errorDescription =
        params.get("error_description") || hashParams.get("error_description");

      if (urlError) {
        setError(errorDescription || urlError);
        return;
      }

      // Detect password recovery flow
      const hashType = hashParams.get("type");
      const isRecovery = hashType === "recovery";
      const destination = isRecovery ? "/dashboard/settings?reset=1" : "/dashboard";

      // PKCE flow: exchange code for session
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
        router.push(destination);
        return;
      }

      // Implicit flow: tokens in hash, auto-detected by supabase client
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(destination);
        return;
      }

      // Listen for auth state change as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          subscription.unsubscribe();
          router.push(destination);
        }
      });

      // Timeout: if nothing happens after 5 seconds, show error
      setTimeout(() => {
        subscription.unsubscribe();
        setError("Could not complete sign in. Please try again.");
      }, 5000);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {error ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <a href="/login" className="text-sm text-foreground underline">
            Back to login
          </a>
        </div>
      ) : (
        <p className="text-muted">Signing you in…</p>
      )}
    </div>
  );
}
