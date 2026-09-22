import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ type: Number, example: 1, description: 'Mahsulot IDsi' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  productId!: number;

  @ApiProperty({ type: Number, example: 10, description: 'Miqdor' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;

  @ApiPropertyOptional({
    type: Number,
    example: 9000,
    description:
      "Birlik narxi (so'mda). PURCHASE/OPENING uchun tannarx snapshoti",
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ type: String, example: 'Sentyabr xaridi' })
  @IsString()
  @IsOptional()
  note?: string;
}
