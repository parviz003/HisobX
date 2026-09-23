import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

/** Mahsulot ichidagi qisqa toifa */
export class ProductCategoryDto {
  @ApiProperty({ type: Number, example: 3 })
  id!: number;

  @ApiProperty({ type: String, example: 'Ichimliklar' })
  name!: string;
}

export class ProductResponseDto {
  @ApiProperty({ type: Number, example: 7 })
  id!: number;

  @ApiProperty({ type: String, example: 'Coca Cola 1L' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '1112223334' })
  barcode!: string | null;

  @ApiProperty({ type: String, example: 'dona' })
  unit!: string;

  @ApiProperty({
    type: Number,
    example: 12000,
    description: "Sotish narxi (so'mda)",
  })
  sellingPrice!: number;

  @ApiProperty({
    type: Number,
    example: 9000,
    description: "Oxirgi xarid narxi — tannarx (so'mda)",
  })
  lastPurchasePrice!: number;

  @ApiProperty({ type: Number, example: 25 })
  stock!: number;

  @ApiProperty({ type: Number, example: 5 })
  minStock!: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  imageUrl!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, nullable: true, example: 3 })
  categoryId!: number | null;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

/** `GET /products` — ro'yxatda toifa qisqa shaklda keladi */
export class ProductListItemDto extends ProductResponseDto {
  @ApiPropertyOptional({ type: ProductCategoryDto, nullable: true })
  category?: ProductCategoryDto | null;
}

/** `GET /products/:id` — toifa to'liq shaklda keladi */
export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiPropertyOptional({ type: CategoryResponseDto, nullable: true })
  category?: CategoryResponseDto | null;
}
