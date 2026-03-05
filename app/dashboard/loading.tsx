export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen justify-center py-12">
      <div className="w-full max-w-2xl space-y-6 px-4">
        {/* Greeting circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-border/50" />
          <div className="h-7 w-48 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-64 animate-pulse rounded bg-border/50" />
        </div>

        {/* Disclaimer bar */}
        <div className="h-14 w-full animate-pulse rounded-lg bg-border/50" />

        {/* Button row */}
        <div className="space-y-3">
          <div className="mx-auto h-5 w-52 animate-pulse rounded bg-border/50" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-10 flex-1 animate-pulse rounded-md bg-border/50" />
            <div className="h-10 flex-1 animate-pulse rounded-md bg-border/50" />
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-border/50" />
              <div className="h-5 w-32 animate-pulse rounded bg-border/50" />
            </div>
            <div className="h-10 w-20 animate-pulse rounded bg-border/50" />
            <div className="flex gap-2">
              <div className="h-7 w-24 animate-pulse rounded-full bg-border/50" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-border/50" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-border/50" />
            </div>
          </div>
        </div>

        {/* 7-day calendar */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-border/50" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-border/50" />
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 animate-pulse rounded-full bg-border/50" />
                <div className="h-3 w-5 animate-pulse rounded bg-border/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
