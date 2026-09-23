import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashTransactionType } from '@prisma/client';

/** `GET /cash/balance` */
export class CashBalanceResponseDto {
  @ApiProperty({
    type: Number,
    example: 1250000,
    description: "Joriy balans (so'mda)",
  })
  balance!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-09-23T09:00:00.000Z',
    description: 'Oxirgi harakat vaqti',
  })
  lastUpdated!: Date | null;
}

export class CashUserDto {
  @ApiProperty({ type: Number, example: 2 })
  id!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Alisher Valiyev' })
  fullName!: string | null;

  @ApiProperty({ type: String, example: '+998901234567' })
  phone!: string;
}

export class CashSaleDto {
  @ApiProperty({ type: Number, example: 9 })
  id!: number;

  @ApiProperty({ type: Number, example: 12 })
  saleNumber!: number;

  @ApiProperty({ type: Number, example: 24000 })
  totalAmount!: number;
}

export class CashTransactionResponseDto {
  @ApiProperty({ type: Number, example: 55 })
  id!: number;

  @ApiProperty({ enum: CashTransactionType, example: CashTransactionType.SALE })
  type!: CashTransactionType;

  @ApiProperty({ type: Number, example: 24000, description: "Summa (so'mda)" })
  amount!: number;

  @ApiProperty({
    type: Number,
    example: 1250000,
    description: 'Shu harakatdan keyingi balans',
  })
  balance!: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  note!: string | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 2 })
  userId!: number;

  @ApiProperty({ type: Number, nullable: true, example: 9 })
  saleId!: number | null;

  @ApiPropertyOptional({ type: CashUserDto })
  user?: CashUserDto;

  @ApiPropertyOptional({ type: CashSaleDto, nullable: true })
  sale?: CashSaleDto | null;

  @ApiProperty({ type: String, example: '2026-09-23T09:00:00.000Z' })
  createdAt!: Date;
}
