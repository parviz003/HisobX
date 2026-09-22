import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { NormalizePhone } from '../../../common/helper/phone';

export class SignInDto {
  @ApiProperty({
    type: String,
    example: '+998917328078',
  })
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    type: String,
    example: 'Superadmin1!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
