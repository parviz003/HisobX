import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Foydalanuvchi o'zi haqida o'zgartira oladigan yagona maydon.
 *
 * `phone` bu yerda YO'Q: telefon raqam — kirish identifikatori va OTP manzili,
 * uni o'zgartirish hisobni egallab olish yo'li bo'lib qolardi.
 * `password` ham YO'Q: parol `PATCH /users/me/password` orqali, joriy parolni
 * tasdiqlagan holda almashtiriladi.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alisher Valiyev', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;
}
