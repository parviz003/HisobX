import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { NormalizePhone } from '../../../common/helper/phone';

export class SignUpDto {
  @ApiProperty({ example: 'My Super Store' })
  @IsString()
  @IsNotEmpty()
  storeName!: string;

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
