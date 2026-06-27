export function ScanSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex items-start gap-3 animate-pulse-soft"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="mt-1 h-4 w-4 rounded bg-slate-700" />
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-32 rounded bg-slate-700" />
              <div className="h-4 w-12 rounded bg-slate-700" />
            </div>
            <div className="h-3 w-64 rounded bg-slate-700" />
            <div className="h-3 w-48 rounded bg-slate-700" />
          </div>
          <div className="h-8 w-16 shrink-0 rounded-lg bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
