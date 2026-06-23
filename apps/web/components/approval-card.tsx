"use client";

import { useState } from "react";
import type { Approval } from "@uar/shared";
import { RiskBadge } from "./risk-badge";

interface Props {
  approval: Approval;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onRevoke: () => Promise<void>;
}

const CHAIN_LABELS: Record<string, string> = {
  solana: "Solana",
  ethereum: "ETH",
  base: "BASE",
  arbitrum: "ARB",
};

const CHAIN_COLORS: Record<string, string> = {
  solana: "text-[var(--accent)] bg-[var(--accent)]/20",
  ethereum: "text-blue-400 bg-blue-400/20",
  base: "text-blue-500 bg-blue-500/20",
  arbitrum: "text-cyan-400 bg-cyan-400/20",
};

export function ApprovalCard({ approval, selected, onSelect, onRevoke }: Props) {
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const { metadata, risk, spender, spenderName, amountFormatted } = approval;
  const shortSpender = `${spender.slice(0, 6)}…${spender.slice(-4)}`;

  async function handleRevoke() {
    setRevoking(true);
    try {
      await onRevoke();
      setRevoked(true);
    } finally {
      setRevoking(false);
    }
  }

  if (revoked) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3 text-sm text-green-400">
        <span>✓</span>
        <span>Revoked — {metadata.symbol} approval cleared</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--card-border)] bg-[var(--card)] hover:border-slate-500"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 h-4 w-4 rounded accent-[var(--accent)]"
        />

        {/* Token logo */}
        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
          {metadata.logoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={metadata.logoUri}
              alt={metadata.symbol}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            metadata.symbol.slice(0, 3)
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--foreground)]">
              {metadata.name}
            </span>
            <span className="text-slate-400 text-sm">({metadata.symbol})</span>
            <RiskBadge level={risk.level} />

            {/* Ecosystem chain badge */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                CHAIN_COLORS[approval.chain] ?? "text-slate-400 bg-slate-700"
              }`}
            >
              {CHAIN_LABELS[approval.chain] ?? approval.chain}
            </span>

            {/* Solana Token-2022 badge */}
            {approval.solana?.tokenProgram === "spl-token-2022" && (
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                Token-2022
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-slate-400 space-y-0.5">
            <div>
              <span className="text-slate-500">
                {approval.ecosystem === "solana" ? "Delegate:" : "Spender:"}
              </span>{" "}
              <span className="font-mono">{shortSpender}</span>
              {spenderName && (
                <span className="ml-1 text-green-400">({spenderName})</span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Approved amount:</span>{" "}
              {amountFormatted === Infinity
                ? "Unlimited"
                : amountFormatted.toLocaleString()}{" "}
              {metadata.symbol}
              {risk.isFullBalance && (
                <span className="ml-2 text-yellow-400 text-xs">
                  full balance
                </span>
              )}
            </div>
            {risk.isStale && (
              <div className="text-yellow-500 text-xs">
                ⚠ Stale — no activity in 90+ days
              </div>
            )}
          </div>

          {/* Risk reasons */}
          <ul className="mt-2 space-y-0.5">
            {risk.reasons.map((r, i) => (
              <li key={i} className="text-xs text-slate-500 flex gap-1">
                <span>·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Revoke button */}
        <button
          onClick={handleRevoke}
          disabled={revoking}
          className="shrink-0 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {revoking ? "Revoking…" : "Revoke"}
        </button>
      </div>
    </div>
  );
}
