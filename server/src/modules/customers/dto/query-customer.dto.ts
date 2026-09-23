import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCustomerDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Alisher',
    description: "Ism yoki telefon bo'yicha qidiruv",
  })
  @IsOptional()
  @IsString()
  search?: string;
}
