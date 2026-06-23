"use client";

import { createConfig, http } from "wagmi";
import { mainnet, base, arbitrum } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId =
  process.env["NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"] ?? "YOUR_PROJECT_ID";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  { projectId, appName: "Universal Approval Revoker" },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, base, arbitrum] as const,
  transports: {
    [mainnet.id]: http(
      process.env["NEXT_PUBLIC_ETHEREUM_RPC_URL"] ??
        "https://cloudflare-eth.com",
    ),
    [base.id]: http(process.env["NEXT_PUBLIC_BASE_RPC_URL"]),
    [arbitrum.id]: http(process.env["NEXT_PUBLIC_ARBITRUM_RPC_URL"]),
  },
});
