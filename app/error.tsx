"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="mx-auto text-muted"
        >
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 30c2 3 5 4.5 8 4.5s6-1.5 8-4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform="scale(1,-1) translate(0,-60)"
          />
          <circle cx="17" cy="20" r="2" fill="currentColor" />
          <circle cx="31" cy="20" r="2" fill="currentColor" />
        </svg>

        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-sm text-muted">
          An unexpected error occurred. Please try again or return to the
          dashboard.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-surface transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-surface"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
