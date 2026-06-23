import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ScanService } from "./scan.service";
import { ScanQueryDto } from "./scan.dto";

@ApiTags("scan")
@Controller("scan")
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Get()
  @ApiOperation({ summary: "Scan a wallet for active SPL token delegations" })
  async scan(@Query() query: ScanQueryDto) {
    try {
      return await this.scanService.scan(query.wallet);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Invalid public key")) {
        throw new BadRequestException("Invalid wallet address");
      }
      throw err;
    }
  }
}
