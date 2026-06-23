import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { EvmController } from "./evm.controller";
import { EvmScanService } from "./evm-scan.service";
import { EvmChainsService } from "./evm-chains.service";

@Module({
  imports: [HttpModule],
  controllers: [EvmController],
  providers: [EvmScanService, EvmChainsService],
})
export class EvmModule {}
