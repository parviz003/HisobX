import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryInventoryDto extends PaginationQueryDto {
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
}
