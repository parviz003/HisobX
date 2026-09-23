import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, example: 'Ichim' })
  @IsOptional()
  @IsString()
  search?: string;
}
