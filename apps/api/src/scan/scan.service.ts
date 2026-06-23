import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Connection, PublicKey } from "@solana/web3.js";
import type { ParsedAccountData } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { scoreRisk } from "@uar/shared";
import type { ScanResponse, TokenDelegation } from "@uar/shared";
import { MetadataService } from "../metadata/metadata.service";

interface ParsedTokenAccountInfo {
  mint: string;
  owner: string;
  tokenAmount: { amount: string; decimals: number; uiAmount: number | null };
  delegate: string | null;
  delegatedAmount: { amount: string; decimals: number } | null;
}

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);
  private readonly connection: Connection;

  constructor(
    private readonly config: ConfigService,
    private readonly metadata: MetadataService,
  ) {
    const rpcUrl = this.config.getOrThrow<string>("HELIUS_RPC_URL");
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  async scan(walletAddress: string): Promise<ScanResponse> {
    const owner = new PublicKey(walletAddress);

    // Fetch both legacy SPL Token and Token-2022 accounts in parallel
    const [legacyAccounts, token2022Accounts] = await Promise.all([
      this.connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
      }),
      this.connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ]);

    const allAccounts = [
      ...legacyAccounts.value.map((a) => ({
        ...a,
        program: "spl-token" as const,
      })),
      ...token2022Accounts.value.map((a) => ({
        ...a,
        program: "spl-token-2022" as const,
      })),
    ];

    // Filter to delegated accounts only
    const delegated = allAccounts.filter((a) => {
      const info = (a.account.data as ParsedAccountData).parsed
        ?.info as ParsedTokenAccountInfo;
      return info?.delegate != null;
    });

    this.logger.debug(
      `Found ${delegated.length} delegated accounts for ${walletAddress}`,
    );

    // Resolve metadata + risk scores in parallel (batched)
    const delegations: TokenDelegation[] = await Promise.all(
      delegated.map(async (a) => {
        const info = (a.account.data as ParsedAccountData).parsed
          ?.info as ParsedTokenAccountInfo;

        const delegate = info.delegate!;
        const delegatedAmount = BigInt(info.delegatedAmount?.amount ?? "0");
        const tokenBalance = BigInt(info.tokenAmount.amount);

        const [tokenMeta, signatures] = await Promise.all([
          this.metadata.getMetadata(info.mint).catch(() => ({
            mint: info.mint,
            symbol: "UNKNOWN",
            name: "Unknown Token",
            decimals: info.tokenAmount.decimals,
            logoUri: undefined,
          })),
          this.connection
            .getSignaturesForAddress(a.pubkey, { limit: 1 })
            .catch(() => []),
        ]);

        const lastActivityAt =
          signatures[0]?.blockTime != null
            ? signatures[0].blockTime * 1000
            : undefined;

        const risk = scoreRisk({
          delegate,
          delegatedAmount,
          tokenBalance,
          lastActivityAt,
        });

        return {
          tokenAccount: a.pubkey.toBase58(),
          mint: info.mint,
          delegate,
          delegatedAmount: delegatedAmount.toString(),
          delegatedAmountUi:
            Number(delegatedAmount) / 10 ** tokenMeta.decimals,
          tokenBalance: tokenBalance.toString(),
          tokenProgram: a.program,
          metadata: {
            symbol: tokenMeta.symbol,
            name: tokenMeta.name,
            decimals: tokenMeta.decimals,
            logoUri: tokenMeta.logoUri,
          },
          risk,
        } satisfies TokenDelegation;
      }),
    );

    const highRiskCount = delegations.filter(
      (d) => d.risk.level === "high",
    ).length;
    const mediumRiskCount = delegations.filter(
      (d) => d.risk.level === "medium",
    ).length;
    const lowRiskCount = delegations.filter(
      (d) => d.risk.level === "low",
    ).length;

    return {
      wallet: walletAddress,
      scannedAt: new Date().toISOString(),
      delegations,
      totalCount: delegations.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    };
  }
}
