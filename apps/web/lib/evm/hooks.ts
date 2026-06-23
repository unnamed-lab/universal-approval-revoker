"use client";

import { useAccount, useChainId, useWalletClient, usePublicClient } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";

/** Returns the chains the user wants to scan (all supported by default). */
export const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: "Ethereum" },
  { id: base.id, name: "Base" },
  { id: arbitrum.id, name: "Arbitrum" },
] as const;

export function useEvmWallet() {
  const { address, isConnected } = useAccount();
  return { address: address ?? undefined, isConnected };
}

export function useEvmPublicClient(chainId?: number) {
  return usePublicClient({ chainId });
}
