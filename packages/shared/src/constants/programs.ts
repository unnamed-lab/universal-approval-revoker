import type { KnownProgram } from "../types/api";

/**
 * Known programs (delegates) that are verifiable protocols.
 * Entries from Jupiter strict list + commonly-used Solana protocols.
 * PRs welcome.
 */
export const KNOWN_PROGRAMS: KnownProgram[] = [
  // ── DEXs / aggregators ──
  {
    programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    name: "Jupiter v6",
    category: "dex",
    verified: true,
    website: "https://jup.ag",
  },
  {
    programId: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    name: "Orca Whirlpools",
    category: "dex",
    verified: true,
    website: "https://orca.so",
  },
  {
    programId: "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
    name: "Orca v2",
    category: "dex",
    verified: true,
    website: "https://orca.so",
  },
  {
    programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    name: "Raydium AMM v4",
    category: "dex",
    verified: true,
    website: "https://raydium.io",
  },
  {
    programId: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
    name: "Raydium CLMM",
    category: "dex",
    verified: true,
    website: "https://raydium.io",
  },
  {
    programId: "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",
    name: "Serum DEX v3",
    category: "dex",
    verified: true,
    website: "https://dex.projectserum.com",
  },
  {
    programId: "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
    name: "Phoenix DEX",
    category: "dex",
    verified: true,
    website: "https://ellipsis.markets",
  },

  // ── Staking / liquid staking ──
  {
    programId: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
    name: "Marinade Finance",
    category: "staking",
    verified: true,
    website: "https://marinade.finance",
  },
  {
    programId: "CrX7kMhLC3cSsgg9uaRrar9LMXa3bv3bGLiBB6ckiXKU",
    name: "Lido (stSOL)",
    category: "staking",
    verified: true,
    website: "https://solana.lido.fi",
  },
  {
    programId: "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy",
    name: "Stake Pool Program",
    category: "staking",
    verified: true,
  },

  // ── Lending ──
  {
    programId: "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",
    name: "Solend",
    category: "lending",
    verified: true,
    website: "https://solend.fi",
  },
  {
    programId: "MFv2hWf31Z9kbCa1snEPdkgqV1w2bRqh7oFMFkFmpWe",
    name: "MarginFi v2",
    category: "lending",
    verified: true,
    website: "https://app.marginfi.com",
  },
  {
    programId: "4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY",
    name: "Drift Protocol",
    category: "lending",
    verified: true,
    website: "https://drift.trade",
  },

  // ── NFT marketplaces ──
  {
    programId: "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
    name: "Magic Eden v2",
    category: "nft",
    verified: true,
    website: "https://magiceden.io",
  },
  {
    programId: "TSWAPaqyCSx2KABk68Shruf4rp7CxcAi9LVkn4eSmJi",
    name: "Tensor Trade",
    category: "nft",
    verified: true,
    website: "https://tensor.trade",
  },
];

export const KNOWN_PROGRAM_IDS = new Set(KNOWN_PROGRAMS.map((p) => p.programId));

export function findKnownProgram(programId: string): KnownProgram | undefined {
  return KNOWN_PROGRAMS.find((p) => p.programId === programId);
}
