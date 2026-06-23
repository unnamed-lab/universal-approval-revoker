import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MetadataService } from "./metadata.service";

@Module({
  imports: [HttpModule],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
