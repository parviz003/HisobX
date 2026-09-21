import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    type: String,
    example: '+998901234567',
  })
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    type: String,
    example: 'Secret123!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
