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

  @ApiProperty({ enum: [Role.ADMIN, Role.SELLER], example: Role.ADMIN })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({
    description: "Mavjud do'kon IDsi (ADMIN/SELLER uchun majburiy)",
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: "storeId berilmasa, ADMIN uchun shu nomda yangi do'kon ochiladi",
  })
  @IsOptional()
  @IsString()
  storeName?: string;
}
