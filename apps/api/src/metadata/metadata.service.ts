import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import type { MetadataResponse } from "@uar/shared";

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
  tags: string[];
  daily_volume: number | null;
  created_at: string | null;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: Record<string, unknown>;
}

interface JupiterStrictList {
  content: JupiterToken[];
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private readonly cache = new Map<string, MetadataResponse>();
  private strictList: JupiterToken[] | null = null;

  constructor(private readonly http: HttpService) {}

  async getMetadata(mint: string): Promise<MetadataResponse> {
    const cached = this.cache.get(mint);
    if (cached) return cached;

    await this.ensureStrictList();

    const fromList = this.strictList?.find((t) => t.address === mint);
    if (fromList) {
      const result: MetadataResponse = {
        mint,
        symbol: fromList.symbol,
        name: fromList.name,
        decimals: fromList.decimals,
        logoUri: fromList.logoURI ?? undefined,
      };
      this.cache.set(mint, result);
      return result;
    }

    try {
      const res = await firstValueFrom(
        this.http.get<{ symbol?: string; name?: string }>(`https://tokens.jup.ag/token/${mint}`),
      );
      const body = res.data;
      if (body?.symbol && body?.name) {
        const result: MetadataResponse = {
          mint,
          symbol: body.symbol,
          name: body.name,
          decimals: 0,
        };
        this.cache.set(mint, result);
        return result;
      }
    } catch {
      // fall through
    }

    const fallback: MetadataResponse = {
      mint,
      symbol: "UNKNOWN",
      name: mint.slice(0, 8) + "...",
      decimals: 0,
    };
    this.cache.set(mint, fallback);
    return fallback;
  }

  private async ensureStrictList(): Promise<void> {
    if (this.strictList) return;
    try {
      const res = await firstValueFrom(
        this.http.get<JupiterStrictList>("https://tokens.jup.ag/strict"),
      );
      this.strictList = res.data.content ?? [];
      this.logger.log(`Loaded ${this.strictList.length} tokens from Jupiter strict list`);
    } catch (err) {
      this.logger.warn(`Failed to load Jupiter strict list: ${String(err)}`);
      this.strictList = [];
    }
  }
}
