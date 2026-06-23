import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EvmChainConfig } from "@uar/shared";

export interface ChainDefinition extends EvmChainConfig {
  explorerApiKey: string;
  rpcUrl: string;
}

@Injectable()
export class EvmChainsService {
  private readonly logger = new Logger(EvmChainsService.name);

  constructor(private readonly config: ConfigService) {}

  private buildChain(
    chainId: number,
    name: string,
    shortName: string,
    explorerUrl: string,
    explorerKeyEnv: string,
    rpcEnv: string,
    symbol: string,
    decimals: number,
  ): ChainDefinition | null {
    const apiKey = this.config.get<string>(explorerKeyEnv);
    const rpcUrl = this.config.get<string>(rpcEnv);
    if (!apiKey) {
      this.logger.warn(`Skipping chain ${name}: ${explorerKeyEnv} not set`);
      return null;
    }
    return {
      chainId,
      name,
      shortName,
      explorerApiUrl: explorerUrl,
      explorerApiKey: apiKey,
      rpcUrl: rpcUrl ?? "",
      nativeCurrency: { symbol, decimals },
    };
  }

  /** All configured (API key present) chains. */
  getConfiguredChains(): ChainDefinition[] {
    return [
      this.buildChain(
        1,
        "Ethereum",
        "eth",
        "https://api.etherscan.io/api",
        "ETHERSCAN_API_KEY",
        "ETHEREUM_RPC_URL",
        "ETH",
        18,
      ),
      this.buildChain(
        8453,
        "Base",
        "base",
        "https://api.basescan.org/api",
        "BASESCAN_API_KEY",
        "BASE_RPC_URL",
        "ETH",
        18,
      ),
      this.buildChain(
        42161,
        "Arbitrum",
        "arb",
        "https://api.arbiscan.io/api",
        "ARBISCAN_API_KEY",
        "ARBITRUM_RPC_URL",
        "ETH",
        18,
      ),
    ].filter(Boolean) as ChainDefinition[];
  }

  /** Return the public-facing config (no secrets). */
  getPublicChains(): EvmChainConfig[] {
    return this.getConfiguredChains().map((c) => ({
      chainId: c.chainId,
      name: c.name,
      shortName: c.shortName,
      explorerApiUrl: c.explorerApiUrl,
      nativeCurrency: c.nativeCurrency,
    }));
  }

  /** Get a single chain definition by ID. */
  getChain(chainId: number): ChainDefinition | undefined {
    return this.getConfiguredChains().find((c) => c.chainId === chainId);
  }
}
