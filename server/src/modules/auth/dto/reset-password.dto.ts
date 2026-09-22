import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { NormalizePhone } from '../../../common/helper/phone';

export class ResetPasswordDto {
  @ApiProperty({ type: String, example: '+998901234567' })
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ type: String, example: '123456' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ type: String, example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
