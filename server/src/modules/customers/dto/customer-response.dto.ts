import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ type: Number, example: 4 })
  id!: number;

  @ApiProperty({ type: String, example: 'Alisher Valiyev' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '+998901234567' })
  phone!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Toshkent, Chilonzor 5',
  })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  notes!: string | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

/** Mijoz qarzi (tafsilot javobida) */
export class CustomerDebtDto {
  @ApiProperty({ type: Number, example: 11 })
  id!: number;

  @ApiProperty({ type: Number, example: 500000 })
  amount!: number;

  @ApiProperty({ type: Number, example: 200000 })
  remainingAmount!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-10-01T00:00:00.000Z',
  })
  dueDate!: Date | null;

  @ApiProperty({ type: Boolean, example: false })
  isPaid!: boolean;

  @ApiProperty({ type: Number, example: 9 })
  saleId!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;
}

/** `GET /customers/:id` */
export class CustomerDetailResponseDto extends CustomerResponseDto {
  @ApiProperty({
    type: CustomerDebtDto,
    isArray: true,
    description: "To'lanmagan qarzlar",
  })
  debts!: CustomerDebtDto[];

  @ApiProperty({
    type: Number,
    example: 200000,
    description: "Jami to'lanmagan qarz (so'mda)",
  })
  totalDebt!: number;
}
