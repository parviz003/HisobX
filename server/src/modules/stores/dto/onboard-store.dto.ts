import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NormalizePhone } from '../../../common/helper/phone';

export class OnboardStoreInfoDto {
  @ApiProperty({ example: 'Mening Do‘konim' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  phone?: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor 5' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class OnboardAdminDto {
  @ApiProperty({ example: 'Alisher Valiyev' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class OnboardStoreDto {
  @ApiProperty({ type: OnboardStoreInfoDto })
  @ValidateNested()
  @Type(() => OnboardStoreInfoDto)
  store!: OnboardStoreInfoDto;

  @ApiProperty({ type: OnboardAdminDto })
  @ValidateNested()
  @Type(() => OnboardAdminDto)
  admin!: OnboardAdminDto;
}
