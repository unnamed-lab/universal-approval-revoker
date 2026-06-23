import type { TokenDelegation, RiskAssessment } from "./delegation";

/** GET /scan?wallet=<address> — Solana */
export interface ScanResponse {
  wallet: string;
  scannedAt: string;
  delegations: TokenDelegation[];
  totalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

/** GET /metadata?mint=<address> */
export interface MetadataResponse {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

/** GET /programs — unified known-program allowlist */
export interface KnownProgram {
  programId: string;
  name: string;
  ecosystem: "solana" | "evm";
  /** EVM-only: which chain this address lives on */
  chainId?: number;
  category: "dex" | "lending" | "staking" | "nft" | "other";
  verified: boolean;
  website?: string;
}

export interface KnownProgramsResponse {
  programs: KnownProgram[];
  updatedAt: string;
}

/* ─── EVM-specific API types ─── */

/** GET /evm/scan */
export interface EvmChainResult {
  chainId: number;
  chainName: string;
  allowances: EvmAllowance[];
}

export interface EvmAllowance {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  tokenLogoUri?: string;
  spender: string;
  allowance: string;
  allowanceFormatted: number;
  risk: RiskAssessment;
}

export interface EvmScanResponse {
  wallet: string;
  scannedAt: string;
  chains: EvmChainResult[];
  totalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

/** GET /evm/chains */
export interface EvmChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  explorerApiUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
}

/** GET /evm/permit-check */
export interface PermitCheckResponse {
  tokenAddress: string;
  chainId: number;
  supportsPermit: boolean;
  domainSeparator?: string;
}

/** POST /evm/batch-revoke */
export interface EvmRevokeRequest {
  chainId: number;
  revocations: {
    tokenAddress: string;
    spender: string;
    permit?: {
      value: string;
      deadline: number;
      v: number;
      r: string;
      s: string;
    };
  }[];
}

export interface EvmRevokeResponse {
  txHash: string;
  chainId: number;
  revokedCount: number;
}
