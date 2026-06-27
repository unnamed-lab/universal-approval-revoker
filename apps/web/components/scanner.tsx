"use client";

import { useState, useCallback, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { encodeFunctionData, type Address } from "viem";
import type { Approval } from "@uar/shared";
import { api } from "@/lib/api";
import { batchRevoke, singleRevoke, type FeeConfig, type RevokeTarget } from "@/lib/solana/revoke";
import { evmBatchRevoke } from "@/lib/evm/revoke";
import { toApproval, toEVMApproval } from "@/lib/mapper";
import { wagmiConfig } from "@/lib/evm/config";
import { ApprovalCard } from "./approval-card";
import { ChainTabs, type ChainFilter } from "./chain-tabs";
import { ScanStats } from "./scan-stats";
import { EvmRevokeModal } from "./evm/evm-revoke-modal";
import { EvmProgress, type RevokeProgress } from "./evm/evm-progress";

const APPROVE_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function buildFeeConfig(): FeeConfig | null {
  const addr = process.env["NEXT_PUBLIC_TREASURY_ADDRESS"];
  const lamports = Number(process.env["NEXT_PUBLIC_BATCH_FEE_LAMPORTS"] ?? 0);
  if (!addr || lamports <= 0) return null;
  return { treasuryAddress: addr, lamports };
}

function feeLabel(config: FeeConfig): string {
  return `${(config.lamports / 1_000_000_000).toFixed(3)} SOL`;
}

export function Scanner() {
  const { publicKey: solPubkey, connected: solConnected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { address: evmAddress, isConnected: evmConnected, chainId: evmChainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const feeConfig = useMemo(() => buildFeeConfig(), []);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
  const [batchRevoking, setBatchRevoking] = useState(false);
  const [evmProgress, setEvmProgress] = useState<RevokeProgress | null>(null);
  const [showEvmModal, setShowEvmModal] = useState(false);
  const [pendingEvmBatch, setPendingEvmBatch] = useState<Approval[]>([]);
  const [pendingEvmChainId, setPendingEvmChainId] = useState<number>(0);
  const [txMessages, setTxMessages] = useState<string[]>([]);

  const isConnected = solConnected || evmConnected;

  const counts = useMemo(() => {
    const c: Record<ChainFilter, number> = { all: 0, solana: 0, ethereum: 0, base: 0, arbitrum: 0 };
    for (const a of approvals) {
      c.all++;
      if (a.chain === "solana") c.solana++;
      else if (a.chain === "ethereum") c.ethereum++;
      else if (a.chain === "base") c.base++;
      else if (a.chain === "arbitrum") c.arbitrum++;
    }
    return c;
  }, [approvals]);

  const filteredApprovals = useMemo(
    () => chainFilter === "all" ? approvals : approvals.filter((a) => a.chain === chainFilter),
    [approvals, chainFilter],
  );

  const handleScan = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    setApprovals([]);
    setSelected(new Set());
    setTxMessages([]);

    const result: Approval[] = [];
    let hadError = false;

    try {
      const promises: Promise<void>[] = [];

      if (solConnected && solPubkey) {
        promises.push(
          (async () => {
            const data = await api.scan(solPubkey.toBase58());
            result.push(...data.delegations.map(toApproval));
          })(),
        );
      }

      if (evmConnected && evmAddress) {
        promises.push(
          (async () => {
            const data = await api.evmScan(evmAddress);
            for (const chain of data.chains) {
              for (const allowance of chain.allowances) {
                result.push(toEVMApproval(chain, allowance));
              }
            }
          })(),
        );
      }

      await Promise.all(promises);
      setApprovals(result);
      setHasScanned(true);
    } catch (err) {
      hadError = true;
      if (result.length > 0) setApprovals(result);
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      if (result.length > 0 || !hadError) setHasScanned(true);
      setScanning(false);
    }
  }, [solConnected, solPubkey, evmConnected, evmAddress]);

  const removeRevoked = useCallback((ids: string[]) => {
    const revokedSet = new Set(ids);
    setApprovals((prev) => prev.filter((a) => !revokedSet.has(a.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const handleSingleRevoke = useCallback(
    async (approval: Approval) => {
      if (approval.ecosystem === "solana") {
        if (!solPubkey) return;
        const target: RevokeTarget = {
          tokenAccount: approval.solana!.tokenAccount,
          tokenProgram: approval.solana!.tokenProgram,
        };
        const result = await singleRevoke(connection, solPubkey, target, sendTransaction);
        removeRevoked([approval.id]);
        setTxMessages((prev) => [
          ...prev,
          `Revoked! Tx: ${result.signature.slice(0, 16)}…`,
        ]);
        return;
      }

      if (!walletClient || !evmAddress) return;

      const currentChain = evmChainId;
      if (currentChain !== approval.chainId) {
        try {
          await switchChainAsync({ chainId: approval.chainId! });
        } catch {
          setTxMessages((prev) => [
            ...prev,
            `Failed: switch to chain ${approval.chainId} required`,
          ]);
          return;
        }
      }

      const txHash = await walletClient.sendTransaction({
        to: approval.tokenAddress as Address,
        data: encodeFunctionData({
          abi: APPROVE_ABI,
          functionName: "approve",
          args: [approval.spender as Address, 0n],
        }),
      });

      removeRevoked([approval.id]);
      setTxMessages((prev) => [
        ...prev,
        `Revoked! Tx: ${txHash.slice(0, 16)}…`,
      ]);
    },
    [solPubkey, connection, sendTransaction, walletClient, evmAddress, evmChainId, switchChainAsync, removeRevoked],
  );

  const executeEvmBatch = useCallback(
    async (approvals: Approval[], chainId: number) => {
      if (!walletClient || !evmAddress) return [];

      const currentChain = evmChainId;
      if (currentChain !== chainId) {
        try {
          await switchChainAsync({ chainId });
        } catch {
          return [];
        }
      }

      const publicClient = getPublicClient(wagmiConfig, { chainId })!;

      const results = await evmBatchRevoke(
        walletClient,
        publicClient,
        evmAddress as Address,
        approvals,
        chainId,
        (msg) => setEvmProgress((prev) => prev ? { ...prev, message: msg } : null),
      );

      return results;
    },
    [walletClient, evmAddress, evmChainId, switchChainAsync],
  );

  const handleBatchRevoke = useCallback(async () => {
    const selectedApprovals = approvals.filter((a) => selected.has(a.id));
    if (selectedApprovals.length === 0) return;

    setBatchRevoking(true);
    setTxMessages([]);

    const solanaApprovals = selectedApprovals.filter((a) => a.ecosystem === "solana");
    const evmApprovals = selectedApprovals.filter((a) => a.ecosystem === "evm");

    const evmByChain = new Map<number, Approval[]>();
    for (const a of evmApprovals) {
      const chainId = a.chainId!;
      if (!evmByChain.has(chainId)) evmByChain.set(chainId, []);
      evmByChain.get(chainId)!.push(a);
    }

    const total = solanaApprovals.length + evmApprovals.length;
    const evmChainIds = [...evmByChain.keys()];

    // Show EVM modal if single-chain EVM batch
    if (solanaApprovals.length === 0 && evmChainIds.length === 1) {
      const chainId = evmChainIds[0]!;
      const chainApprovals = evmByChain.get(chainId)!;
      setPendingEvmBatch(chainApprovals);
      setPendingEvmChainId(chainId);
      setShowEvmModal(true);
      return;
    }

    // Mixed or multi-chain EVM: process directly
    try {
      // Solana batch
      if (solanaApprovals.length > 0) {
        const targets: RevokeTarget[] = solanaApprovals.map((a) => ({
          tokenAccount: a.solana!.tokenAccount,
          tokenProgram: a.solana!.tokenProgram,
        }));
        const results = await batchRevoke(connection, solPubkey!, targets, sendTransaction, feeConfig);
        const revokedIds = solanaApprovals.map((a) => a.id);
        removeRevoked(revokedIds);
        setTxMessages((prev) => [
          ...prev,
          ...results.map(
            (r) => `Solana: revoked ${r.revokedAccounts.length} approval(s). Tx: ${r.signature.slice(0, 16)}…`,
          ),
        ]);
      }

      // EVM per chain
      for (const [chainId, chainApprovals] of evmByChain) {
        const chainResults = await executeEvmBatch(chainApprovals, chainId);
        const revokedIds = chainApprovals.map((a) => a.id);
        removeRevoked(revokedIds);
        for (const r of chainResults) {
          setTxMessages((prev) => [
            ...prev,
            `EVM chain ${chainId}: revoked ${r.revokedAddresses.length} approval(s). Tx: ${r.txHash.slice(0, 16)}…`,
          ]);
        }
      }
    } finally {
      setBatchRevoking(false);
      setEvmProgress(null);
    }
  }, [approvals, selected, connection, solPubkey, sendTransaction, feeConfig, removeRevoked, executeEvmBatch]);

  const confirmEvmBatch = useCallback(async () => {
    setShowEvmModal(false);
    if (pendingEvmBatch.length === 0) return;

    setEvmProgress({ phase: "signing", current: 0, total: pendingEvmBatch.length, message: "Checking permit support…" });

    try {
      const results = await executeEvmBatch(pendingEvmBatch, pendingEvmChainId);
      const revokedIds = pendingEvmBatch.map((a) => a.id);
      removeRevoked(revokedIds);
      for (const r of results) {
        setTxMessages((prev) => [
          ...prev,
          `EVM: revoked ${r.revokedAddresses.length} approval(s). Tx: ${r.txHash.slice(0, 16)}…`,
        ]);
      }
    } finally {
      setBatchRevoking(false);
      setEvmProgress(null);
    }
  }, [pendingEvmBatch, pendingEvmChainId, executeEvmBatch, removeRevoked]);

  const cancelEvmBatch = useCallback(() => {
    setShowEvmModal(false);
    setPendingEvmBatch([]);
    setBatchRevoking(false);
  }, []);

  const hasSolanaSelected = useMemo(
    () => approvals.some((a) => selected.has(a.id) && a.ecosystem === "solana"),
    [approvals, selected],
  );

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === filteredApprovals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredApprovals.map((a) => a.id)));
    }
  }, [selected, filteredApprovals]);

  const batchButtonLabel = useMemo(() => {
    if (batchRevoking) return "Revoking…";
    const base = `Revoke ${selected.size}`;
    return hasSolanaSelected && feeConfig
      ? `${base} · ${feeLabel(feeConfig)} fee`
      : base;
  }, [batchRevoking, selected.size, feeConfig, hasSolanaSelected]);

  // Build modal breakdown
  const evmBreakdown = useMemo(() => {
    const selectedEvm = approvals.filter((a) => selected.has(a.id) && a.ecosystem === "evm");
    return {
      permitCount: selectedEvm.length,
      nonPermitCount: 0,
      totalTxs: 1,
    };
  }, [approvals, selected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-slate-200">Connect your wallet to start</h2>
        <p className="mt-2 text-slate-400 max-w-sm">
          Connect a Solana or EVM wallet above. We&apos;ll scan for active token
          approvals and let you revoke any that look risky.
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
          {scanning ? "Scanning…" : approvals.length > 0 ? "Re-scan" : "Scan Wallet"}
        </button>
        {approvals.length > 0 && (
          <p className="text-sm text-slate-400">
            Found {approvals.length} active approval{approvals.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {scanError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {scanError}
        </div>
      )}

      {evmProgress && <EvmProgress progress={evmProgress} />}

      {approvals.length === 0 && !scanning && !scanError && hasScanned && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-400 font-medium">No active approvals found</p>
          <p className="text-slate-400 text-sm mt-1">Your wallets look clean!</p>
        </div>
      )}

      {approvals.length === 0 && !scanning && !scanError && !hasScanned && (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/50 p-8 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-slate-400 font-medium">No approvals scanned yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Click &quot;Scan Wallet&quot; to check your connected wallets for active token approvals.
          </p>
        </div>
      )}

      {approvals.length > 0 && (
        <>
          <ScanStats approvals={approvals} />

          {/* Chain tabs + batch controls */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <ChainTabs active={chainFilter} counts={counts} onChange={setChainFilter} />

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
                  {batchButtonLabel}
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
              {selected.size === filteredApprovals.length
                ? "Deselect all"
                : "Select all"}
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-sm text-slate-500">
              {filteredApprovals.length} shown
            </span>
          </div>

          {/* Approval list */}
          <div className="space-y-3">
            {filteredApprovals.map((a) => (
              <ApprovalCard
                key={a.id}
                approval={a}
                selected={selected.has(a.id)}
                onSelect={(checked) => toggleSelect(a.id, checked)}
                onRevoke={() => handleSingleRevoke(a)}
              />
            ))}
          </div>
        </>
      )}

      {/* EVM batch revoke modal */}
      <EvmRevokeModal
        breakdown={evmBreakdown}
        onConfirm={confirmEvmBatch}
        onCancel={cancelEvmBatch}
        open={showEvmModal}
      />

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
