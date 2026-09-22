import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';
import { NormalizePhone } from '../../../common/helper/phone';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alisher Valiyev' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  phone?: string;

  /**
   * ADMIN faqat SELLER rolini bera oladi.
   * ADMIN yoki SUPERADMIN roliga ko'tarish faqat SUPERADMIN qo'lida.
   */
  @ApiPropertyOptional({ enum: [Role.ADMIN, Role.SELLER] })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /** Bloklash/faollashtirish. isActive avtomatik shu qiymatga moslashtiriladi. */
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
