import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export class ScanQueryDto {
  @ApiProperty({ description: "Solana wallet address (base58)", example: "So1..." })
  @IsString()
  @Matches(BASE58_RE, { message: "wallet must be a valid base58 public key" })
  wallet!: string;
}
