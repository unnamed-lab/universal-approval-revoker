"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-[var(--foreground)] tracking-tight">
            Approval Revoker
          </span>
        </div>
        <div className="flex items-center gap-2">
          <WalletMultiButton />
          <ConnectButton chainStatus="none" showBalance={false} />
        </div>
      </div>
    </header>
  );
}
