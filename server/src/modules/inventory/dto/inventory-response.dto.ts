import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '@prisma/client';
import { PaginationMetaDto } from '../../../common/swagger';
import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class InventoryProductDto {
  @ApiProperty({ type: Number, example: 7 })
  id!: number;

  @ApiProperty({ type: String, example: 'Coca Cola 1L' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '1112223334' })
  barcode!: string | null;

  @ApiProperty({ type: String, example: 'dona' })
  unit!: string;
}

export class InventoryTransactionResponseDto {
  @ApiProperty({ type: Number, example: 40 })
  id!: number;

  @ApiProperty({
    enum: InventoryTransactionType,
    example: InventoryTransactionType.PURCHASE,
  })
  type!: InventoryTransactionType;

  @ApiProperty({ type: Number, example: 10 })
  quantity!: number;

  @ApiProperty({ type: Number, nullable: true, example: 9000 })
  unitPrice!: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Sentyabr xaridi' })
  note!: string | null;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 7 })
  productId!: number;

  @ApiPropertyOptional({ type: InventoryProductDto })
  product?: InventoryProductDto;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;
}

/** Kirim/chiqim natijasi: yangilangan mahsulot va yozuv */
export class InventoryOperationResponseDto {
  @ApiProperty({ type: ProductResponseDto })
  product!: ProductResponseDto;

  @ApiProperty({ type: InventoryTransactionResponseDto })
  transaction!: InventoryTransactionResponseDto;
}

/** `GET /inventory/transactions` */
export class InventoryTransactionListResponseDto extends PaginationMetaDto {
  @ApiProperty({ type: InventoryTransactionResponseDto, isArray: true })
  data!: InventoryTransactionResponseDto[];
}

/** `GET /inventory/stock` */
export class StockLevelResponseDto {
  @ApiProperty({ type: Number, example: 7 })
  id!: number;

  @ApiProperty({ type: String, example: 'Coca Cola 1L' })
  name!: string;

  @ApiProperty({ type: Number, example: 25 })
  stock!: number;

  @ApiProperty({ type: Number, example: 5 })
  minStock!: number;

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: '`stock <= minStock` bo‘lsa true',
  })
  lowStock!: boolean;
}
