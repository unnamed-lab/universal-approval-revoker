import { findKnownProgram } from "../constants/programs";
import type { RiskAssessment, RiskLevel } from "../types/delegation";

const STALE_THRESHOLD_DAYS = 90;
const MS_PER_DAY = 86_400_000;

export interface ScorerInput {
  delegate: string;
  delegatedAmount: bigint;
  tokenBalance: bigint;
  /** Unix timestamp (ms) of the last activity on this token account. undefined = unknown. */
  lastActivityAt?: number;
}

export function scoreRisk(input: ScorerInput): RiskAssessment {
  const { delegate, delegatedAmount, tokenBalance, lastActivityAt } = input;
  const reasons: string[] = [];
  let level: RiskLevel = "low";

  const known = findKnownProgram(delegate);
  const isKnownProtocol = !!known;

  // full-balance or suspiciously large delegation
  const isFullBalance = tokenBalance > 0n && delegatedAmount >= tokenBalance;
  if (isFullBalance && !isKnownProtocol) {
    reasons.push("Delegate has approval for your full token balance");
    level = max(level, "high");
  } else if (isFullBalance && isKnownProtocol) {
    reasons.push(`Full-balance approval to ${known!.name} — common for DEX/lending interactions`);
  }

  // unknown program
  if (!isKnownProtocol) {
    reasons.push("Delegate is not a recognized protocol");
    level = max(level, delegatedAmount > 0n ? "high" : "medium");
  }

  // stale delegation
  const isStale =
    lastActivityAt !== undefined &&
    Date.now() - lastActivityAt > STALE_THRESHOLD_DAYS * MS_PER_DAY;

  if (isStale) {
    reasons.push(`Delegation has been inactive for over ${STALE_THRESHOLD_DAYS} days`);
    level = max(level, "medium");
  }

  if (reasons.length === 0) {
    reasons.push(`Recognized protocol: ${known!.name}`);
  }

  return {
    level,
    reasons,
    isKnownProtocol,
    knownProtocolName: known?.name,
    isStale: !!isStale,
    isFullBalance,
  };
}

function max(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
  return (order[a] ?? 0) >= (order[b] ?? 0) ? a : b;
}
