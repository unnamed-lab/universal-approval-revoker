import type { KnownProgram } from "../types/api";

/**
 * Unified allowlist of known programs across Solana and EVM.
 *
 * Solana entries: programId = program pubkey (base58), ecosystem = "solana".
 * EVM entries:    programId = contract address (0x-checksummed), ecosystem = "evm",
 *                 chainId    = the EVM chain this address is valid on.
 *
 * Sources: Jupiter verified list, Uniswap docs, protocol docs, community submissions.
 * PRs welcome.
 */
export const KNOWN_PROGRAMS: KnownProgram[] = [
  // ══════════════════════════════════════════════
  //  SOLANA
  // ══════════════════════════════════════════════

  // ── DEXs / aggregators ──
  {
    programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    name: "Jupiter v6",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://jup.ag",
  },
  {
    programId: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    name: "Orca Whirlpools",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://orca.so",
  },
  {
    programId: "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
    name: "Orca v2",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://orca.so",
  },
  {
    programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    name: "Raydium AMM v4",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://raydium.io",
  },
  {
    programId: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
    name: "Raydium CLMM",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://raydium.io",
  },
  {
    programId: "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",
    name: "Serum DEX v3",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://dex.projectserum.com",
  },
  {
    programId: "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
    name: "Phoenix DEX",
    ecosystem: "solana",
    category: "dex",
    verified: true,
    website: "https://ellipsis.markets",
  },

  // ── Staking / liquid staking ──
  {
    programId: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
    name: "Marinade Finance",
    ecosystem: "solana",
    category: "staking",
    verified: true,
    website: "https://marinade.finance",
  },
  {
    programId: "CrX7kMhLC3cSsgg9uaRrar9LMXa3bv3bGLiBB6ckiXKU",
    name: "Lido (stSOL)",
    ecosystem: "solana",
    category: "staking",
    verified: true,
    website: "https://solana.lido.fi",
  },
  {
    programId: "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy",
    name: "Stake Pool Program",
    ecosystem: "solana",
    category: "staking",
    verified: true,
  },

  // ── Lending ──
  {
    programId: "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",
    name: "Solend",
    ecosystem: "solana",
    category: "lending",
    verified: true,
    website: "https://solend.fi",
  },
  {
    programId: "MFv2hWf31Z9kbCa1snEPdkgqV1w2bRqh7oFMFkFmpWe",
    name: "MarginFi v2",
    ecosystem: "solana",
    category: "lending",
    verified: true,
    website: "https://app.marginfi.com",
  },
  {
    programId: "4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY",
    name: "Drift Protocol",
    ecosystem: "solana",
    category: "lending",
    verified: true,
    website: "https://drift.trade",
  },

  // ── NFT marketplaces ──
  {
    programId: "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
    name: "Magic Eden v2",
    ecosystem: "solana",
    category: "nft",
    verified: true,
    website: "https://magiceden.io",
  },
  {
    programId: "TSWAPaqyCSx2KABk68Shruf4rp7CxcAi9LVkn4eSmJi",
    name: "Tensor Trade",
    ecosystem: "solana",
    category: "nft",
    verified: true,
    website: "https://tensor.trade",
  },

  // ══════════════════════════════════════════════
  //  EVM — Ethereum mainnet (chainId: 1)
  // ══════════════════════════════════════════════

  // ── DEXs / aggregators ──
  {
    programId: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    name: "Uniswap V3 Router",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://app.uniswap.org",
  },
  {
    programId: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    name: "Uniswap V2 Router",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://app.uniswap.org",
  },
  {
    programId: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    name: "1inch v5 Router",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://1inch.io",
  },
  {
    programId: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    name: "SushiSwap Router",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://sushi.com",
  },
  {
    programId: "0xF0d4c12A5768D806021F80a262B4d39d26C58b8D",
    name: "Curve Router",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://curve.fi",
  },
  {
    programId: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    name: "Balancer V2 Vault",
    ecosystem: "evm",
    chainId: 1,
    category: "dex",
    verified: true,
    website: "https://balancer.fi",
  },

  // ── Lending ──
  {
    programId: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    name: "Aave V3 Pool",
    ecosystem: "evm",
    chainId: 1,
    category: "lending",
    verified: true,
    website: "https://aave.com",
  },
  {
    programId: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
    name: "Aave V2 LendingPool",
    ecosystem: "evm",
    chainId: 1,
    category: "lending",
    verified: true,
    website: "https://aave.com",
  },
  {
    programId: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    name: "Compound III (USDC)",
    ecosystem: "evm",
    chainId: 1,
    category: "lending",
    verified: true,
    website: "https://compound.finance",
  },
  {
    programId: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    name: "Morpho Blue",
    ecosystem: "evm",
    chainId: 1,
    category: "lending",
    verified: true,
    website: "https://morpho.org",
  },
  {
    programId: "0xC13e21B648A5Ee794902342038FF3aDAB66BE987",
    name: "Spark Lend",
    ecosystem: "evm",
    chainId: 1,
    category: "lending",
    verified: true,
    website: "https://spark.fi",
  },

  // ── Staking / restaking ──
  {
    programId: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    name: "Lido stETH",
    ecosystem: "evm",
    chainId: 1,
    category: "staking",
    verified: true,
    website: "https://lido.fi",
  },
  {
    programId: "0xd9A442856C234a39a81a089C06451EBAa4306a72",
    name: "Rocket Pool",
    ecosystem: "evm",
    chainId: 1,
    category: "staking",
    verified: true,
    website: "https://rocketpool.net",
  },
  {
    programId: "0x858646372CC42E1a627fcE94aa7A7033e7CF075A",
    name: "EigenLayer Strategy Manager",
    ecosystem: "evm",
    chainId: 1,
    category: "staking",
    verified: true,
    website: "https://eigenlayer.xyz",
  },

  // ── NFT marketplaces ──
  {
    programId: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
    name: "OpenSea Seaport 1.5",
    ecosystem: "evm",
    chainId: 1,
    category: "nft",
    verified: true,
    website: "https://opensea.io",
  },
  {
    programId: "0x0000000000A39bb272e79075ade125fd3512aC0",
    name: "Blur",
    ecosystem: "evm",
    chainId: 1,
    category: "nft",
    verified: true,
    website: "https://blur.io",
  },

  // ══════════════════════════════════════════════
  //  EVM — Base (chainId: 8453)
  // ══════════════════════════════════════════════

  {
    programId: "0x2626664c2603336E57B271c5C0b26F421741e481",
    name: "Uniswap V3 Router (Base)",
    ecosystem: "evm",
    chainId: 8453,
    category: "dex",
    verified: true,
    website: "https://app.uniswap.org",
  },
  {
    programId: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
    name: "Aerodrome Router",
    ecosystem: "evm",
    chainId: 8453,
    category: "dex",
    verified: true,
    website: "https://aerodrome.finance",
  },
  {
    programId: "0x00000000000001ad428e4906aE43D8F9852d0dD6",
    name: "OpenSea Seaport (Base)",
    ecosystem: "evm",
    chainId: 8453,
    category: "nft",
    verified: true,
    website: "https://opensea.io",
  },

  // ══════════════════════════════════════════════
  //  EVM — Arbitrum (chainId: 42161)
  // ══════════════════════════════════════════════

  {
    programId: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    name: "Uniswap V3 Router (Arbitrum)",
    ecosystem: "evm",
    chainId: 42161,
    category: "dex",
    verified: true,
    website: "https://app.uniswap.org",
  },
  {
    programId: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    name: "Aave V3 Pool (Arbitrum)",
    ecosystem: "evm",
    chainId: 42161,
    category: "lending",
    verified: true,
    website: "https://aave.com",
  },
];

export const KNOWN_PROGRAM_IDS = new Set(KNOWN_PROGRAMS.map((p) => p.programId));

export function findKnownProgram(
  programId: string,
  options?: { ecosystem?: "solana" | "evm"; chainId?: number },
): KnownProgram | undefined {
  return KNOWN_PROGRAMS.find((p) => {
    if (p.programId !== programId) return false;
    if (options?.ecosystem && p.ecosystem !== options.ecosystem) return false;
    if (options?.chainId && p.chainId !== options.chainId) return false;
    return true;
  });
}
