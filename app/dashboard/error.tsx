"use client";

export default function DashboardError({
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
          className="mx-auto text-accent-green"
        >
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path
            d="M16 16l16 16M32 16L16 32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-sm text-muted">
          Don&apos;t worry — your data is safe. This is a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex-1 rounded-md bg-accent-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
