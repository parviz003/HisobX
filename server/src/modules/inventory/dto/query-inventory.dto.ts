import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '@prisma/client';

export class QueryInventoryDto {
  @ApiPropertyOptional({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ enum: InventoryTransactionType })
  @IsEnum(InventoryTransactionType)
  @IsOptional()
  type?: InventoryTransactionType;

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, example: 10, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
