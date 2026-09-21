import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
    type: String,
    example: 'd9b2d63d-a262-4211-8975-4d7426eb6128',
    description: 'Xarajat toifasi ID si',
  })
  @IsUUID()
  @IsNotEmpty()
  expenseCategoryId!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Do‘kon ijarasi uchun to‘lov',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
