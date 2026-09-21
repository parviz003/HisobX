import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CashTransactionType } from '@prisma/client';

export class QueryCashTransactionDto {
  @ApiPropertyOptional({ enum: CashTransactionType })
  @IsEnum(CashTransactionType)
  @IsOptional()
  type?: CashTransactionType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
