import { findKnownProgram } from "../constants/programs";
import { scoreRisk } from "./scorer";
import type { RiskAssessment } from "../types/delegation";

export const MAX_UINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export interface EvmScorerInput {
  spender: string;
  allowance: bigint;
  tokenBalance: bigint;
  chainId: number;
  /** Unix timestamp (ms) of last activity with this spender. undefined = unknown. */
  lastActivityAt?: number;
}

/**
 * Score risk for an EVM token allowance.
 *
 * Detects infinite/max-uint256 approvals and passes through
 * to the shared scoreRisk function for the rest.
 */
export function evmScoreRisk(input: EvmScorerInput): RiskAssessment {
  const { spender, allowance, tokenBalance, chainId, lastActivityAt } = input;

  const known = findKnownProgram(spender, { ecosystem: "evm", chainId });
  const isKnownProtocol = !!known;

  const isInfinite = allowance >= MAX_UINT256;

  // Build reasons manually for EVM-specific signals, then delegate
  const reasons: string[] = [];

  if (isInfinite && !isKnownProtocol) {
    reasons.push("Unlimited (max uint256) approval to an unrecognized address");
  } else if (isInfinite && isKnownProtocol) {
    reasons.push(
      `Unlimited approval to ${known!.name} — common for DEX/lending interactions`,
    );
  }

  // Delegate to shared scorer for non-infinite signals
  // Pass the allowance as delegatedAmount — the base scorer handles
  // full-balance + unknown + stale logic identically.
  const base = scoreRisk({
    delegate: spender,
    delegatedAmount: allowance,
    tokenBalance,
    lastActivityAt,
  });

  // Merge reasons, preserving EVM-specific ones first
  const merged: RiskAssessment = {
    ...base,
    reasons: [...new Set([...reasons, ...base.reasons])],
  };

  // Elevate risk for infinite allowance + unknown
  if (isInfinite && !isKnownProtocol) {
    merged.level = "high";
  }

  return merged;
}
