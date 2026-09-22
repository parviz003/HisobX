import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({
    type: Number,
    example: 150000,
    description: 'Xarajat summasi',
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Xarajat toifasi ID si',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  expenseCategoryId!: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Do‘kon ijarasi uchun to‘lov',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
