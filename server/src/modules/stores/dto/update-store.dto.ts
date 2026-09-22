import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NormalizePhone } from '../../../common/helper/phone';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Mening Do‘konim' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor 5' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '-1001234567890',
    description: "Do'kon Telegram guruhi chat IDsi",
  })
  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
