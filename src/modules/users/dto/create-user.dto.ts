import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
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
    example: 1,
    description:
      "SUPERADMIN uchun majburiy — xodim qo'shiladigan mavjud do'kon ID'si." +
      " ADMIN uchun e'tiborsiz qoldiriladi (o'z do'koni ishlatiladi)." +
      " Yangi do'kon + ADMIN yaratish uchun POST /stores/onboard ishlatiladi.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;
}
