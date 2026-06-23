import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import type { MetadataResponse } from "@uar/shared";

interface HeliusDasAsset {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
  };
  token_info?: { decimals?: number; symbol?: string };
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private readonly cache = new Map<string, MetadataResponse>();
  private readonly heliusApiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.heliusApiKey = this.config.getOrThrow<string>("HELIUS_API_KEY");
  }

  async getMetadata(mint: string): Promise<MetadataResponse> {
    const cached = this.cache.get(mint);
    if (cached) return cached;

    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`;
      const { data } = await firstValueFrom(
        this.http.post<{ result: HeliusDasAsset }>(url, {
          jsonrpc: "2.0",
          id: "uar",
          method: "getAsset",
          params: { id: mint },
        }),
      );

      const asset = data.result;
      const result: MetadataResponse = {
        mint,
        symbol: asset.token_info?.symbol ?? asset.content?.metadata?.symbol ?? "UNKNOWN",
        name: asset.content?.metadata?.name ?? mint.slice(0, 8),
        decimals: asset.token_info?.decimals ?? 0,
        logoUri: asset.content?.links?.image,
      };

      this.cache.set(mint, result);
      return result;
    } catch (err) {
      this.logger.warn(`Failed to fetch metadata for mint ${mint}: ${String(err)}`);
      return {
        mint,
        symbol: "UNKNOWN",
        name: mint.slice(0, 8) + "...",
        decimals: 0,
      };
    }
  }
}
