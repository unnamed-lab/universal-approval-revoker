import type {
  ScanResponse,
  KnownProgramsResponse,
  EvmScanResponse,
  EvmChainConfig,
  PermitCheckResponse,
} from "@uar/shared";

const BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api/v1";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Solana
  scan: (wallet: string) => get<ScanResponse>(`/scan?wallet=${wallet}`),
  programs: () => get<KnownProgramsResponse>("/programs"),

  // EVM
  evmScan: (wallet: string, chains?: string) =>
    get<EvmScanResponse>(`/evm/scan?wallet=${wallet}${chains ? `&chains=${chains}` : ""}`),
  evmChains: () => get<EvmChainConfig[]>("/evm/chains"),
  evmPermitCheck: (tokenAddress: string, chainId: number) =>
    get<PermitCheckResponse>(
      `/evm/permit-check?tokenAddress=${tokenAddress}&chainId=${chainId}`,
    ),
};
