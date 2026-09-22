import { ApiProperty } from '@nestjs/swagger';

/** `GET /reports/daily` */
export class DailyReportResponseDto {
  @ApiProperty({
    type: String,
    example: '2026-09-23',
    description: 'YYYY-MM-DD',
  })
  date!: string;

  @ApiProperty({ type: Number, example: 12 })
  salesCount!: number;

  @ApiProperty({
    type: Number,
    example: 1450000,
    description: "Tushum (so'mda)",
  })
  revenue!: number;

  @ApiProperty({
    type: Number,
    example: 900000,
    description: "Tannarx (so'mda)",
  })
  cogs!: number;

  @ApiProperty({ type: Number, example: 550000, description: 'Yalpi foyda' })
  grossProfit!: number;

  @ApiProperty({ type: Number, example: 300000, description: 'Xarajatlar' })
  expenses!: number;

  @ApiProperty({ type: Number, example: 250000, description: 'Sof foyda' })
  netProfit!: number;

  @ApiProperty({ type: Number, example: 1250000 })
  cashBalance!: number;

  @ApiProperty({
    type: Number,
    example: 700000,
    description: "To'lanmagan qarzlar",
  })
  totalOutstandingDebt!: number;

  @ApiProperty({ type: Number, example: 3 })
  lowStockProductsCount!: number;
}

/** `GET /reports/monthly` */
export class MonthlyReportResponseDto {
  @ApiProperty({ type: Number, example: 2026 })
  year!: number;

  @ApiProperty({ type: Number, example: 9, description: '1-12' })
  month!: number;

  @ApiProperty({ type: Number, example: 310 })
  totalSalesCount!: number;

  @ApiProperty({ type: Number, example: 42000000 })
  revenue!: number;

  @ApiProperty({ type: Number, example: 28000000 })
  cogs!: number;

  @ApiProperty({ type: Number, example: 14000000 })
  grossProfit!: number;

  @ApiProperty({ type: Number, example: 5000000 })
  expenses!: number;

  @ApiProperty({ type: Number, example: 9000000 })
  netProfit!: number;
}
