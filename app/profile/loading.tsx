export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto w-full max-w-lg space-y-8 px-4">
        {/* Title */}
        <div className="h-7 w-28 animate-pulse rounded bg-border/50" />

        {/* Avatar circle */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-36 w-36 animate-pulse rounded-full bg-border/50" />
          <div className="h-6 w-32 animate-pulse rounded bg-border/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-border/50" />
        </div>

        {/* Personal info card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 animate-pulse rounded bg-border/50" />
            <div className="h-8 w-14 animate-pulse rounded-md bg-border/50" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-border/50" />
                <div className="h-4 w-32 animate-pulse rounded bg-border/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Endo card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-border/50" />
            <div className="h-8 w-14 animate-pulse rounded-md bg-border/50" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-border/50" />
                <div className="h-4 w-24 animate-pulse rounded bg-border/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
