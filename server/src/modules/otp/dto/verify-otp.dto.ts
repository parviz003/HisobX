import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NormalizePhone } from '../../../common/helper/phone';

export class VerifyOTPDto {
  @ApiProperty({
    type: String,
    example: '+998901234567',
  })
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    type: String,
    example: '123456',
  })
  @Length(6, 6)
  @IsString()
  @IsNotEmpty()
  code!: string;
}
