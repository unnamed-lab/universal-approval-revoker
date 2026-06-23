import { Module } from "@nestjs/common";
import { ScanController } from "./scan.controller";
import { ScanService } from "./scan.service";
import { MetadataModule } from "../metadata/metadata.module";

@Module({
  imports: [MetadataModule],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
