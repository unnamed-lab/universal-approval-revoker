"use client";

interface BatchBreakdown {
  permitCount: number;
  nonPermitCount: number;
  totalTxs: number;
}

interface Props {
  breakdown: BatchBreakdown;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
}

export function EvmRevokeModal({ breakdown, onConfirm, onCancel, open }: Props) {
  if (!open) return null;

  const { permitCount, nonPermitCount, totalTxs } = breakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Batch Revoke
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
            <span className="text-slate-300">
              Using permit (1 tx)
            </span>
            <span className="font-semibold text-green-400">{permitCount}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
            <span className="text-slate-300">
              Individual approve(0)
            </span>
            <span className="font-semibold text-yellow-400">{nonPermitCount}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 border border-[var(--card-border)]">
            <span className="text-slate-200 font-medium">Total transactions</span>
            <span className="font-semibold text-[var(--foreground)]">{totalTxs}</span>
          </div>

          {nonPermitCount > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Tokens without EIP-2612 permit support (USDT, etc.) require
              individual approve(0) transactions — one wallet popup each.
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Revoke — {totalTxs} tx{totalTxs !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
