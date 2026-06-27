import type { RiskAssessment, TokenMetadata } from "./delegation";

export type Ecosystem = "solana" | "evm";

/**
 * Unified approval representation shared across Solana and EVM.
 * Frontend components consume this type; API mappers convert
 * ecosystem-specific types (TokenDelegation / EvmAllowance) into it.
 */
export interface Approval {
  /** Unique key: `${ecosystem}:${chain}:${tokenAddress}:${spender}` */
  id: string;
  ecosystem: Ecosystem;
  /** "solana" | "ethereum" | "base" | "arbitrum" */
  chain: string;
  /** EVM chain ID (undefined for Solana) */
  chainId?: number;

  /** Delegate (Solana) or approved spender (EVM) */
  spender: string;
  spenderName?: string;
  /** Raw amount in smallest unit */
  amount: string;
  /** Human-readable amount */
  amountFormatted: number;

  /** Token mint (Solana) or contract address (EVM) */
  tokenAddress: string;
  metadata: TokenMetadata;
  risk: RiskAssessment;

  /** Solana-specific fields */
  solana?: {
    tokenAccount: string;
    tokenProgram: "spl-token" | "spl-token-2022";
  };
  /** EVM-specific fields */
  evm?: {
    owner: string;
  };
}
