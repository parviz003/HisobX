import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, SaleStatus } from '@prisma/client';
import { CustomerResponseDto } from '../../customers/dto/customer-response.dto';

export class SaleProductDto {
  @ApiProperty({ type: String, example: 'Coca Cola 1L' })
  name!: string;

  @ApiProperty({ type: String, example: 'dona' })
  unit!: string;
}

export class SaleItemResponseDto {
  @ApiProperty({ type: Number, example: 21 })
  id!: number;

  @ApiProperty({ type: Number, example: 2 })
  quantity!: number;

  @ApiProperty({
    type: Number,
    example: 12000,
    description: "Sotish narxi (so'mda)",
  })
  price!: number;

  @ApiProperty({
    type: Number,
    example: 9000,
    description: "Tannarx (so'mda). SELLER uchun qaytarilmaydi",
  })
  costPrice!: number;

  @ApiProperty({ type: Number, example: 24000 })
  total!: number;

  @ApiProperty({ type: Number, example: 9 })
  saleId!: number;

  @ApiProperty({ type: Number, example: 7 })
  productId!: number;

  @ApiPropertyOptional({ type: SaleProductDto })
  product?: SaleProductDto;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;
}

export class SaleUserDto {
  @ApiProperty({ type: String, nullable: true, example: 'Alisher' })
  name!: string | null;
}

export class SaleCustomerShortDto {
  @ApiProperty({ type: String, example: 'Alisher Valiyev' })
  name!: string;
}

export class SaleResponseDto {
  @ApiProperty({ type: Number, example: 9 })
  id!: number;

  @ApiProperty({
    type: Number,
    example: 12,
    description: "Do'kon ichidagi tartib raqam",
  })
  saleNumber!: number;

  @ApiProperty({ enum: SaleStatus, example: SaleStatus.COMPLETED })
  status!: SaleStatus;

  @ApiProperty({ enum: PaymentType, example: PaymentType.CASH })
  paymentType!: PaymentType;

  @ApiProperty({ type: Number, example: 24000 })
  subtotal!: number;

  @ApiProperty({ type: Number, example: 0 })
  discountPercent!: number;

  @ApiProperty({ type: Number, example: 0 })
  discountAmount!: number;

  @ApiProperty({ type: Number, example: 24000 })
  totalAmount!: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  note!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  deletedAt!: Date | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 2 })
  userId!: number;

  @ApiProperty({ type: Number, nullable: true, example: 4 })
  customerId!: number | null;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

/** `GET /sales/:id` */
export class SaleDetailResponseDto extends SaleResponseDto {
  @ApiProperty({ type: SaleItemResponseDto, isArray: true })
  saleItems!: SaleItemResponseDto[];

  @ApiPropertyOptional({ type: CustomerResponseDto, nullable: true })
  customer?: CustomerResponseDto | null;

  @ApiPropertyOptional({ type: SaleUserDto })
  user?: SaleUserDto;
}

/** `GET /sales` ro'yxatidagi element */
export class SaleListItemDto extends SaleResponseDto {
  @ApiPropertyOptional({ type: SaleCustomerShortDto, nullable: true })
  customer?: SaleCustomerShortDto | null;

  @ApiPropertyOptional({ type: SaleUserDto })
  user?: SaleUserDto;
}
