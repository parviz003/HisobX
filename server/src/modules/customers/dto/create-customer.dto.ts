import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NormalizePhone } from '../../../common/helper/phone';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alisher Valiyev' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor 5' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Doimiy mijoz' })
  @IsString()
  @IsOptional()
  notes?: string;
}
