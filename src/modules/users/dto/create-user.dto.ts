import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Alisher Valiyev' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password!: string;

  /** ADMIN faqat SELLER yaratadi; ADMIN yaratish SUPERADMIN huquqida */
  @ApiProperty({ enum: [Role.ADMIN, Role.SELLER], example: Role.SELLER })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({
    description:
      "Faqat SUPERADMIN uchun. ADMIN uchun e'tiborsiz qoldiriladi (o'z do'koni)",
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description:
      "SUPERADMIN ADMIN yaratganda storeId o'rniga yangi do'kon nomi berilishi mumkin",
  })
  @IsOptional()
  @IsString()
  storeName?: string;
}
