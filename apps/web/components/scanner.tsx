"use client";

import { useState, useCallback, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import type { ScanResponse, TokenDelegation } from "@uar/shared";
import { api } from "@/lib/api";
import { batchRevoke, singleRevoke, type FeeConfig } from "@/lib/solana/revoke";
import { DelegationCard } from "./delegation-card";
import { ScanStats } from "./scan-stats";

type FilterLevel = "all" | "high" | "medium" | "low";

/** Read fee config from env. Returns null if treasury not configured. */
function buildFeeConfig(): FeeConfig | null {
  const addr = process.env["NEXT_PUBLIC_TREASURY_ADDRESS"];
  const lamports = Number(process.env["NEXT_PUBLIC_BATCH_FEE_LAMPORTS"] ?? 0);
  if (!addr || lamports <= 0) return null;
  return { treasuryAddress: addr, lamports };
}

/** Returns a human-readable fee label, e.g. "0.001 SOL". */
function feeLabel(config: FeeConfig): string {
  return `${(config.lamports / 1_000_000_000).toFixed(3)} SOL`;
}

/** Recompute the count fields from a delegations array. */
function recount(delegations: TokenDelegation[]): Pick<ScanResponse, "totalCount" | "highRiskCount" | "mediumRiskCount" | "lowRiskCount"> {
  return {
    totalCount: delegations.length,
    highRiskCount: delegations.filter((d) => d.risk.level === "high").length,
    mediumRiskCount: delegations.filter((d) => d.risk.level === "medium").length,
    lowRiskCount: delegations.filter((d) => d.risk.level === "low").length,
  };
}

export function Scanner() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [batchRevoking, setBatchRevoking] = useState(false);
  const [txMessages, setTxMessages] = useState<string[]>([]);

  const feeConfig = useMemo(() => buildFeeConfig(), []);

  const handleScan = useCallback(async () => {
    if (!publicKey) return;
    setScanning(true);
    setScanError(null);
    setScanData(null);
    setSelected(new Set());
    setTxMessages([]);

    try {
      const data = await api.scan(publicKey.toBase58());
      setScanData(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [publicKey]);

  /** Remove a set of revoked token accounts from scanData and update counts. */
  const removeRevoked = useCallback((revokedAccounts: string[]) => {
    const revokedSet = new Set(revokedAccounts);
    setScanData((prev) => {
      if (!prev) return prev;
      const remaining = prev.delegations.filter(
        (d) => !revokedSet.has(d.tokenAccount),
      );
      return { ...prev, delegations: remaining, ...recount(remaining) };
    });
    setSelected((prev) => {
      const next = new Set(prev);
      revokedAccounts.forEach((a) => next.delete(a));
      return next;
    });
  }, []);

  const handleSingleRevoke = useCallback(
    async (delegation: TokenDelegation) => {
      if (!publicKey) return;
      const result = await singleRevoke(
        connection,
        publicKey,
        delegation,
        sendTransaction,
      );
      removeRevoked([delegation.tokenAccount]);
      setTxMessages((prev) => [
        ...prev,
        `Revoked! Tx: ${result.signature.slice(0, 16)}…`,
      ]);
    },
    [connection, publicKey, removeRevoked, sendTransaction],
  );

  const handleBatchRevoke = useCallback(async () => {
    if (!publicKey || !scanData || selected.size === 0) return;
    setBatchRevoking(true);
    try {
      const toRevoke = scanData.delegations.filter((d) =>
        selected.has(d.tokenAccount),
      );
      const results = await batchRevoke(
        connection,
        publicKey,
        toRevoke,
        sendTransaction,
        feeConfig,
      );
      const allRevoked = results.flatMap((r) => r.revokedAccounts);
      removeRevoked(allRevoked);
      setTxMessages((prev) => [
        ...prev,
        ...results.map(
          (r) =>
            `Batch revoked ${r.revokedAccounts.length} approval(s). Tx: ${r.signature.slice(0, 16)}…`,
        ),
      ]);
    } finally {
      setBatchRevoking(false);
    }
  }, [connection, feeConfig, publicKey, removeRevoked, scanData, selected, sendTransaction]);

  const filteredDelegations =
    scanData?.delegations.filter(
      (d) => filter === "all" || d.risk.level === filter,
    ) ?? [];

  const toggleSelect = (tokenAccount: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tokenAccount);
      else next.delete(tokenAccount);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredDelegations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredDelegations.map((d) => d.tokenAccount)));
    }
  };

  const batchButtonLabel = () => {
    if (batchRevoking) return "Revoking…";
    const base = `Revoke ${selected.size} (1 signature)`;
    return feeConfig ? `${base} · ${feeLabel(feeConfig)} fee` : base;
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-slate-200">Connect your wallet to start</h2>
        <p className="mt-2 text-slate-400 max-w-sm">
          We&apos;ll scan all your SPL token accounts for active delegations and
          let you revoke any that look risky.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scan button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="rounded-xl bg-[var(--accent)] hover:bg-[#7b35d9] disabled:opacity-50 text-white font-semibold px-6 py-2.5 transition-colors"
        >
          {scanning ? "Scanning…" : scanData ? "Re-scan" : "Scan Wallet"}
        </button>
        {scanData && (
          <p className="text-sm text-slate-400">
            Found {scanData.totalCount} active delegation
            {scanData.totalCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {scanError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {scanError}
        </div>
      )}

      {scanData && scanData.totalCount === 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-400 font-medium">No active delegations found</p>
          <p className="text-slate-400 text-sm mt-1">Your wallet looks clean!</p>
        </div>
      )}

      {scanData && scanData.totalCount > 0 && (
        <>
          <ScanStats data={scanData} />

          {/* Filter tabs + batch controls */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-1 rounded-lg bg-[var(--card)] border border-[var(--card-border)] p-1">
              {(["all", "high", "medium", "low"] as FilterLevel[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-[var(--accent)] text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {selected.size} selected
                </span>
                <button
                  onClick={handleBatchRevoke}
                  disabled={batchRevoking}
                  className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors"
                >
                  {batchButtonLabel()}
                </button>
              </div>
            )}
          </div>

          {/* Select all */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {selected.size === filteredDelegations.length
                ? "Deselect all"
                : "Select all"}
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-sm text-slate-500">
              {filteredDelegations.length} shown
            </span>
          </div>

          {/* Delegation list */}
          <div className="space-y-3">
            {filteredDelegations.map((d) => (
              <DelegationCard
                key={d.tokenAccount}
                delegation={d}
                selected={selected.has(d.tokenAccount)}
                onSelect={(checked) => toggleSelect(d.tokenAccount, checked)}
                onRevoke={() => handleSingleRevoke(d)}
              />
            ))}
          </div>
        </>
      )}

      {/* TX confirmations */}
      {txMessages.length > 0 && (
        <div className="space-y-2">
          {txMessages.map((msg, i) => (
            <div
              key={i}
              className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-400 font-mono"
            >
              ✓ {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
