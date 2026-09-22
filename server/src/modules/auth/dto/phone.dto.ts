import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { NormalizePhone } from '../../../common/helper/phone';

export class PhoneDto {
  @ApiProperty({ type: String, example: '+998901234567' })
  @NormalizePhone()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;
}
