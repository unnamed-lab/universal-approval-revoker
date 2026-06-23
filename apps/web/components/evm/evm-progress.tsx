"use client";

export interface RevokeProgress {
  phase: "signing" | "submitting" | "confirming" | "done";
  current: number;
  total: number;
  message: string;
}

interface Props {
  progress: RevokeProgress | null;
}

const PHASE_LABELS: Record<string, string> = {
  signing: "Signing permits…",
  submitting: "Submitting transactions…",
  confirming: "Confirming…",
  done: "Done",
};

export function EvmProgress({ progress }: Props) {
  if (!progress || progress.phase === "done") return null;

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">
          {PHASE_LABELS[progress.phase] ?? progress.message}
        </span>
        <span className="text-slate-500 font-mono text-xs">
          {progress.current}/{progress.total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.message && (
        <p className="text-xs text-slate-500">{progress.message}</p>
      )}
    </div>
  );
}
