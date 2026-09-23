import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryExpenseDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  expenseCategoryId?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
