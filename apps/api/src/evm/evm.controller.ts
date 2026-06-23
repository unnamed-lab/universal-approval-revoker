import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { EvmScanService } from "./evm-scan.service";
import { EvmChainsService } from "./evm-chains.service";
import { EvmScanQueryDto, EvmPermitCheckQueryDto } from "./evm.dto";

const DOMAIN_SEPARATOR_SIG = "0x3644e515";

@ApiTags("evm")
@Controller("evm")
export class EvmController {
  constructor(
    private readonly scanService: EvmScanService,
    private readonly chains: EvmChainsService,
    private readonly http: HttpService,
  ) {}

  @Get("scan")
  @ApiOperation({ summary: "Scan an EVM wallet for active token allowances across chains" })
  async scan(@Query() query: EvmScanQueryDto) {
    try {
      const chainIds = query.chains
        ? query.chains.split(",").map(Number).filter((n) => !isNaN(n))
        : undefined;
      return await this.scanService.scan(query.wallet, chainIds);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Scan failed",
      );
    }
  }

  @Get("chains")
  @ApiOperation({ summary: "List supported EVM chains" })
  chainsList() {
    return this.chains.getPublicChains();
  }

  @Get("permit-check")
  @ApiOperation({ summary: "Check if a token supports EIP-2612 permit" })
  async permitCheck(@Query() query: EvmPermitCheckQueryDto) {
    const chain = this.chains.getChain(query.chainId);
    if (!chain) {
      throw new BadRequestException(`Unsupported chain: ${query.chainId}`);
    }
    if (!chain.rpcUrl) {
      return { tokenAddress: query.tokenAddress, chainId: query.chainId, supportsPermit: false };
    }

    try {
      const { data } = await firstValueFrom(
        this.http.post(chain.rpcUrl, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            { to: query.tokenAddress, data: DOMAIN_SEPARATOR_SIG },
            "latest",
          ],
        }),
      );
      const result = (data as { result?: string }).result;
      const supportsPermit = !!result && result !== "0x" && result.length > 2;
      return {
        tokenAddress: query.tokenAddress,
        chainId: query.chainId,
        supportsPermit,
        domainSeparator: supportsPermit ? result : undefined,
      };
    } catch {
      return { tokenAddress: query.tokenAddress, chainId: query.chainId, supportsPermit: false };
    }
  }
}
