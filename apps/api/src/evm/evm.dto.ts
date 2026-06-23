import { IsString, Matches, IsOptional, IsInt, Min, ArrayMinSize, IsArray } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export class EvmScanQueryDto {
  @ApiProperty({ description: "EVM wallet address (0x-checksummed)", example: "0x..." })
  @IsString()
  @Matches(EVM_ADDRESS_RE, { message: "wallet must be a valid 0x-prefixed address" })
  wallet!: string;

  @ApiProperty({ description: "Comma-separated chain IDs", example: "1,8453,42161" })
  @IsOptional()
  @IsString()
  chains?: string;
}

export class EvmPermitCheckQueryDto {
  @ApiProperty({ description: "Token contract address" })
  @IsString()
  @Matches(EVM_ADDRESS_RE)
  tokenAddress!: string;

  @ApiProperty({ description: "Chain ID", example: 1 })
  @IsInt()
  @Min(1)
  chainId!: number;
}

export class EvmRevocationItem {
  @IsString()
  @Matches(EVM_ADDRESS_RE)
  tokenAddress!: string;

  @IsString()
  @Matches(EVM_ADDRESS_RE)
  spender!: string;
}

export class EvmRevokeBodyDto {
  @ApiProperty({ description: "Chain ID", example: 1 })
  @IsInt()
  @Min(1)
  chainId!: number;

  @ApiProperty({ description: "Revocations to execute (up to 10 per batch)" })
  @IsArray()
  @ArrayMinSize(1)
  revocations!: EvmRevocationItem[];
}
