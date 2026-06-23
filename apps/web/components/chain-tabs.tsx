"use client";

export type ChainFilter =
  | "all"
  | "solana"
  | "ethereum"
  | "base"
  | "arbitrum";

interface Props {
  active: ChainFilter;
  counts: Record<ChainFilter, number>;
  onChange: (filter: ChainFilter) => void;
}

const LABELS: Record<ChainFilter, string> = {
  all: "All",
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
};

const CHAINS: ChainFilter[] = ["all", "solana", "ethereum", "base", "arbitrum"];

export function ChainTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-[var(--card)] border border-[var(--card-border)] p-1 overflow-x-auto">
      {CHAINS.map((chain) => {
        const count = counts[chain] ?? 0;
        const isActive = active === chain;
        return (
          <button
            key={chain}
            onClick={() => onChange(chain)}
            disabled={count === 0 && chain !== "all"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-[var(--accent)] text-white"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {LABELS[chain]}
            {count > 0 && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
