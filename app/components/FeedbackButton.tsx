"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Bug", "Idea", "Frustration", "Love it", "Other"] as const;

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    const { data } = await supabase.auth.getUser();
    await supabase.from("feedback").insert({
      user_id: data.user?.id,
      category: category || null,
      message: message.trim(),
      page: window.location.pathname,
    });
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setCategory("");
      setMessage("");
    }, 2000);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-lg transition-all hover:shadow-xl hover:bg-background"
        aria-label="Give feedback"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-green"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Give feedback
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-t-xl sm:rounded-xl border border-border bg-background p-6 shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-foreground"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-serif text-lg font-semibold text-foreground">Thank you</p>
                <p className="text-sm text-muted">Your feedback helps shape this app.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    Share your feedback
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Anything on your mind — bugs, ideas, or things you love.
                  </p>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(category === cat ? "" : cat)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        category === cat
                          ? "border-accent-green bg-accent-green/10 text-accent-green"
                          : "border-border text-muted hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  required
                  className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent-green focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full rounded-md bg-accent-green py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
