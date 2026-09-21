import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOTPDto } from './dto/send-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Public()
  @Post('send')
  sendOtp(@Body() dto: SendOTPDto) {
    return this.otpService.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify')
  verifyOtp(@Body() dto: VerifyOTPDto) {
    return this.otpService.verifyOtp(dto.phone, dto.code);
  }
}
