export default function OverviewLoading() {
  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-4xl space-y-6 px-4">
        {/* Title */}
        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-border/50" />

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="h-4 w-20 animate-pulse rounded bg-border/50" />
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-border/50" />
          <div className="h-64 w-full animate-pulse rounded-lg bg-border/50" />
        </div>

        {/* Second chart */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 h-5 w-36 animate-pulse rounded bg-border/50" />
          <div className="h-48 w-full animate-pulse rounded-lg bg-border/50" />
        </div>
      </div>
    </div>
  );
}
