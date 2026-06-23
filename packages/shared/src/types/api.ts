import type { TokenDelegation } from "./delegation";

/** GET /scan?wallet=<address> */
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

/** GET /programs — returns the known-program allowlist */
export interface KnownProgram {
  programId: string;
  name: string;
  category: "dex" | "lending" | "staking" | "nft" | "other";
  verified: boolean;
  website?: string;
}

export interface KnownProgramsResponse {
  programs: KnownProgram[];
  updatedAt: string;
}
