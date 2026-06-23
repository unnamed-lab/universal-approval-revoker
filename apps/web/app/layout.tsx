import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { EvmProvider } from "@/providers/evm-provider";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Universal Approval Revoker",
  description:
    "Scan your Solana and EVM wallets for active token approvals and revoke risky ones in one click.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <EvmProvider>
          <SolanaWalletProvider>
            <Navbar />
            {children}
          </SolanaWalletProvider>
        </EvmProvider>
      </body>
    </html>
  );
}
