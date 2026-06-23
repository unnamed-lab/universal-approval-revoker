import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScanModule } from "./scan/scan.module";
import { ProgramsModule } from "./programs/programs.module";
import { MetadataModule } from "./metadata/metadata.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScanModule,
    ProgramsModule,
    MetadataModule,
  ],
})
export class AppModule {}
