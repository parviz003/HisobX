import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CashTransactionType } from '@prisma/client';

export class CreateCashTransactionDto {
  @ApiProperty({
    enum: CashTransactionType,
    example: CashTransactionType.OPENING,
    description: 'Kassa harakati turi',
  })
  @IsEnum(CashTransactionType)
  @IsNotEmpty()
  type!: CashTransactionType;

  @ApiProperty({
    type: Number,
    example: 1000000,
    description: 'Summa (so‘mda)',
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount!: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Boshlang‘ich kassa summasi',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
