import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExpenseCategoryDto {
  @ApiProperty({
    type: String,
    example: 'Ijara to‘lovi',
    description: 'Xarajat toifasi nomi',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Kommunal xizmatlar',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
