"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface px-6 py-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-sm text-muted sm:text-left">
          This site uses localStorage for essential authentication. No cookies
          or third-party tracking.{" "}
          <Link href="/privacy" className="text-accent-green underline">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 rounded-md bg-accent-green px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
