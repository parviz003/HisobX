import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseCategoryResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  id!: number;

  @ApiProperty({ type: String, example: 'Ijara' })
  name!: string;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

export class ExpenseUserDto {
  @ApiProperty({ type: Number, example: 2 })
  id!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Alisher Valiyev' })
  fullName!: string | null;
}

export class ExpenseResponseDto {
  @ApiProperty({ type: Number, example: 14 })
  id!: number;

  @ApiProperty({ type: Number, example: 300000, description: "Summa (so'mda)" })
  amount!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Sentyabr ijarasi' })
  note!: string | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 2 })
  expenseCategoryId!: number;

  @ApiProperty({ type: Number, example: 2 })
  userId!: number;

  @ApiPropertyOptional({ type: ExpenseCategoryResponseDto })
  expenseCategory?: ExpenseCategoryResponseDto;

  @ApiPropertyOptional({ type: ExpenseUserDto })
  user?: ExpenseUserDto;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}
