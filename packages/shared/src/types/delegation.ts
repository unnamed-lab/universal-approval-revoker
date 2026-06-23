export type RiskLevel = "low" | "medium" | "high";

export interface TokenDelegation {
  /** Token account pubkey (base58) */
  tokenAccount: string;
  /** Mint pubkey (base58) */
  mint: string;
  /** Delegate program/account pubkey (base58) */
  delegate: string;
  /** Raw delegated amount (in smallest units) */
  delegatedAmount: string;
  /** Human-readable amount (accounting for decimals) */
  delegatedAmountUi: number;
  /** Full token balance in smallest units */
  tokenBalance: string;
  /** Token program: "spl-token" | "spl-token-2022" */
  tokenProgram: "spl-token" | "spl-token-2022";
  /** Token metadata */
  metadata: TokenMetadata;
  /** Risk assessment */
  risk: RiskAssessment;
}

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
  /** true if the delegate is a well-known protocol */
  isKnownProtocol: boolean;
  knownProtocolName?: string;
  /** true if the delegation is older than 90 days with no recent activity */
  isStale: boolean;
  /** delegatedAmount >= tokenBalance */
  isFullBalance: boolean;
}
