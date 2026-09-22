import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class PhoneDto {
  @ApiProperty({ type: String, example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;
}
