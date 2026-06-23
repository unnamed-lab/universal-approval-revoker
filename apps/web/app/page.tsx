import { Scanner } from "@/components/scanner";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
          Universal Approval Scanner
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          Scan your Solana and EVM wallets for active token approvals. Identify
          risky approvals and revoke them instantly — single or batch, one
          signature.
        </p>
      </div>

      <Scanner />

      <footer className="mt-16 border-t border-[var(--card-border)] pt-8 text-center text-sm text-slate-600">
        <p>
          Open source · No custody · Your keys, your tokens
        </p>
        <p className="mt-1">
          Solana + Ethereum + Base + Arbitrum
        </p>
      </footer>
    </main>
  );
}
