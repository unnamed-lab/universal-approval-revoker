import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { evmScoreRisk, MAX_UINT256 } from "@uar/shared";
import type { EvmAllowance, EvmScanResponse, EvmChainResult } from "@uar/shared";
import { EvmChainsService, type ChainDefinition } from "./evm-chains.service";

/* ─── Etherscan getLogs response shape ─── */

interface EtherscanLog {
  address: string; // token contract (lowercase)
  topics: string[]; // [eventSig, owner(padded), spender(padded)]
  data: string; // hex-encoded uint256 value
  timeStamp: string;
  /** Unique log ID from Etherscan: "txHash_logIndex" */
  logIndex: string;
}

interface EtherscanLogsResponse {
  status: "1" | "0";
  message: string;
  result: EtherscanLog[];
}

/* ─── Token metadata from on-chain calls ─── */

interface TokenMeta {
  symbol: string;
  name: string;
  decimals: number;
}

const APPROVAL_EVENT_SIG = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

@Injectable()
export class EvmScanService {
  private readonly logger = new Logger(EvmScanService.name);
  private readonly metaCache = new Map<string, TokenMeta>();

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly chains: EvmChainsService,
  ) {}

  /* ─── Public entry point ─── */

  async scan(
    wallet: string,
    chainIds?: number[],
  ): Promise<EvmScanResponse> {
    const targets = chainIds
      ? chainIds.map((id) => this.chains.getChain(id)).filter(Boolean) as ChainDefinition[]
      : this.chains.getConfiguredChains();

    const results = await Promise.allSettled(
      targets.map((chain) => this.scanChain(chain, wallet)),
    );

    const chains: EvmChainResult[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        chains.push(r.value);
      }
    }

    const allAllowances = chains.flatMap((c) => c.allowances);
    return {
      wallet,
      scannedAt: new Date().toISOString(),
      chains,
      totalCount: allAllowances.length,
      highRiskCount: allAllowances.filter((a) => a.risk.level === "high").length,
      mediumRiskCount: allAllowances.filter((a) => a.risk.level === "medium").length,
      lowRiskCount: allAllowances.filter((a) => a.risk.level === "low").length,
    };
  }

  /* ─── Single-chain scan ─── */

  private async scanChain(
    chain: ChainDefinition,
    wallet: string,
  ): Promise<EvmChainResult> {
    const logs = await this.fetchApprovalLogs(chain, wallet);

    // Deduplicate: keep the most recent entry per (token, spender)
    const latest = new Map<string, EtherscanLog>();
    for (const log of logs) {
      const spender = this.parseSpender(log);
      if (!spender) continue;
      const key = `${log.address.toLowerCase()}:${spender.toLowerCase()}`;
      const existing = latest.get(key);
      if (!existing || Number(log.timeStamp) > Number(existing.timeStamp)) {
        latest.set(key, log);
      }
    }

    // Build allowances from deduplicated logs
    const allowances: EvmAllowance[] = [];
    for (const [, log] of latest) {
      const spender = this.parseSpender(log)!;
      const allowance = BigInt(log.data);
      if (allowance <= 0n) continue; // already zero

      const meta = await this.getTokenMeta(chain, log.address);

      const risk = evmScoreRisk({
        spender,
        allowance,
        tokenBalance: 0n, // unknown from logs alone
        chainId: chain.chainId,
      });

      const allowanceFormatted = Number(allowance) / 10 ** meta.decimals;

      allowances.push({
        tokenAddress: log.address,
        tokenSymbol: meta.symbol,
        tokenName: meta.name,
        tokenDecimals: meta.decimals,
        spender,
        allowance: allowance.toString(),
        allowanceFormatted: allowance >= MAX_UINT256 ? Infinity : allowanceFormatted,
        risk,
      });
    }

    return {
      chainId: chain.chainId,
      chainName: chain.name,
      allowances,
    };
  }

  /* ─── Explorer API: getLogs ─── */

  private async fetchApprovalLogs(
    chain: ChainDefinition,
    wallet: string,
  ): Promise<EtherscanLog[]> {
    const paddedOwner = "0x000000000000000000000000" + wallet.slice(2).toLowerCase();
    const allLogs: EtherscanLog[] = [];
    let page = 1;

    for (;;) {
      const url = `${chain.explorerApiUrl}`;
      const params = {
        module: "logs",
        action: "getLogs",
        fromBlock: "0",
        toBlock: "latest",
        topic0: APPROVAL_EVENT_SIG,
        topic0_1_opr: "and",
        topic1: paddedOwner,
        page,
        offset: "1000",
        apikey: chain.explorerApiKey,
      };

      try {
        const { data } = await firstValueFrom(
          this.http.get<EtherscanLogsResponse>(url, { params }),
        );

        if (data.status === "0") {
          this.logger.warn(`Etherscan error for ${chain.name}: ${data.message}`);
          break;
        }

        if (!Array.isArray(data.result) || data.result.length === 0) break;

        allLogs.push(...data.result);
        if (data.result.length < 1000) break; // last page
        page++;
      } catch (err) {
        this.logger.error(
          `Failed to fetch logs for ${chain.name}: ${String(err)}`,
        );
        break;
      }
    }

    return allLogs;
  }

  /* ─── Helpers ─── */

  private parseSpender(log: EtherscanLog): string | null {
    // topics[2] = indexed spender (32 bytes, 0x-padded)
    const raw = log.topics[2];
    if (!raw || raw.length < 42) return null;
    return "0x" + raw.slice(26).toLowerCase();
  }

  private async getTokenMeta(
    chain: ChainDefinition,
    tokenAddress: string,
  ): Promise<TokenMeta> {
    const cacheKey = `${chain.chainId}:${tokenAddress.toLowerCase()}`;
    const cached = this.metaCache.get(cacheKey);
    if (cached) return cached;

    // Fallback: on-chain calls via RPC
    const meta = chain.rpcUrl
      ? await this.fetchOnChainMeta(chain, tokenAddress)
      : { symbol: "UNKNOWN", name: "Unknown Token", decimals: 0 };

    this.metaCache.set(cacheKey, meta);
    return meta;
  }

  private async fetchOnChainMeta(
    chain: ChainDefinition,
    tokenAddress: string,
  ): Promise<TokenMeta> {
    const [symbol, name, decimals] = await Promise.all([
      this.ethCall(chain, tokenAddress, "0x95d89b41"), // symbol()
      this.ethCall(chain, tokenAddress, "0x06fdde03"), // name()
      this.ethCall(chain, tokenAddress, "0x313ce567"), // decimals()
    ]);
    return {
      symbol: this.decodeString(symbol),
      name: this.decodeString(name),
      decimals: Number(decimals ?? "0x0"),
    };
  }

  private async ethCall(
    chain: ChainDefinition,
    to: string,
    data: string,
  ): Promise<string | undefined> {
    try {
      const { data: res } = await firstValueFrom(
        this.http.post(chain.rpcUrl, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to, data }, "latest"],
        }),
      );
      return (res as { result?: string }).result;
    } catch {
      return undefined;
    }
  }

  private decodeString(hex?: string): string {
    if (!hex || hex === "0x") return "UNKNOWN";
    try {
      const bytes = hex.startsWith("0x") ? hex.slice(2) : hex;
      const raw = Buffer.from(bytes, "hex");

      // ERC20 name/symbol encoding: typically offset length-prefixed
      let result: string;
      try {
        // Try ABI-decoded string (offset, length, data)
        const dataOffset = Number(raw.readUInt32BE(0));
        if (dataOffset <= raw.length) {
          const strLen = Number(raw.readUInt32BE(dataOffset));
          result = raw.subarray(dataOffset + 4, dataOffset + 4 + strLen).toString("utf8");
        } else {
          result = raw.toString("utf8").replace(/\0/g, "").trim();
        }
      } catch {
        result = raw.toString("utf8").replace(/\0/g, "").trim();
      }
      return result || "UNKNOWN";
    } catch {
      return "UNKNOWN";
    }
  }
}
