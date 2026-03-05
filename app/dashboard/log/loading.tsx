export default function LogLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6 px-4">
        {/* Title */}
        <div className="mx-auto h-7 w-36 animate-pulse rounded bg-border/50" />

        {/* Date field */}
        <div className="space-y-2">
          <div className="h-5 w-10 animate-pulse rounded bg-border/50" />
          <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
        </div>

        {/* Slider bars */}
        <div className="space-y-5 pt-6">
          <div className="h-5 w-28 animate-pulse rounded bg-border/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-border/50" />
              <div className="h-2 w-full animate-pulse rounded-full bg-border/50" />
              <div className="flex justify-between">
                <div className="h-3 w-10 animate-pulse rounded bg-border/50" />
                <div className="h-3 w-12 animate-pulse rounded bg-border/50" />
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="h-10 w-full animate-pulse rounded-md bg-border/50" />
      </div>
    </div>
  );
}
