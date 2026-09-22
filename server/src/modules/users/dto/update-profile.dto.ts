import {
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Foydalanuvchi faqat shu maydonlarni o'zgartira oladi (rol va holat bundan mustasno) */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alisher Valiyev' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
