import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DebtCustomerDto {
  @ApiProperty({ type: Number, example: 4 })
  id!: number;

  @ApiProperty({ type: String, example: 'Alisher Valiyev' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '+998901234567' })
  phone!: string | null;
}

export class DebtSaleDto {
  @ApiProperty({ type: Number, example: 9 })
  id!: number;

  @ApiProperty({ type: Number, example: 12 })
  saleNumber!: number;

  @ApiProperty({ type: Number, example: 500000 })
  totalAmount!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;
}

export class DebtPaymentResponseDto {
  @ApiProperty({ type: Number, example: 31 })
  id!: number;

  @ApiProperty({ type: Number, example: 100000 })
  amount!: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  note!: string | null;

  @ApiProperty({ type: Number, example: 11 })
  debtId!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;
}

export class DebtResponseDto {
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

  @ApiProperty({ type: String, nullable: true, example: null })
  note!: string | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 9 })
  saleId!: number;

  @ApiProperty({ type: Number, example: 4 })
  customerId!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

/** `GET /debts` ro'yxatidagi element */
export class DebtListItemDto extends DebtResponseDto {
  @ApiPropertyOptional({ type: DebtCustomerDto })
  customer?: DebtCustomerDto;

  @ApiPropertyOptional({ type: DebtSaleDto })
  sale?: DebtSaleDto;
}

export class DebtListMetaDto {
  @ApiProperty({ type: Number, example: 42 })
  total!: number;

  @ApiProperty({ type: Number, example: 1 })
  page!: number;

  @ApiProperty({ type: Number, example: 10 })
  limit!: number;

  @ApiProperty({ type: Number, example: 5 })
  totalPages!: number;
}

/** `GET /debts` */
export class DebtListResponseDto {
  @ApiProperty({ type: DebtListItemDto, isArray: true })
  data!: DebtListItemDto[];

  @ApiProperty({ type: DebtListMetaDto })
  meta!: DebtListMetaDto;
}

/** `GET /debts/:id` */
export class DebtDetailResponseDto extends DebtResponseDto {
  @ApiPropertyOptional({ type: DebtCustomerDto })
  customer?: DebtCustomerDto;

  @ApiProperty({ type: DebtPaymentResponseDto, isArray: true })
  debtPayments!: DebtPaymentResponseDto[];
}

/** `GET /debts/overdue` — mijoz bo'yicha guruhlangan */
export class OverdueDebtGroupDto {
  @ApiProperty({ type: DebtCustomerDto })
  customer!: DebtCustomerDto;

  @ApiProperty({
    type: Number,
    example: 700000,
    description: "Jami qarz (so'mda)",
  })
  totalOwed!: number;

  @ApiProperty({ type: DebtResponseDto, isArray: true })
  debts!: DebtResponseDto[];
}
