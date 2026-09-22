import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@prisma/client';

export class SaleItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  customerId?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercent?: number;

  @IsString()
  @IsOptional()
  note?: string;

  /** Nasiya savdo uchun qarz muddati (ixtiyoriy) */
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
