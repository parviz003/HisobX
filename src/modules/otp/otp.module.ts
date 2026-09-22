import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ConsoleOtpSender } from './console-otp-sender';
import { OTP_SENDER } from './otp-sender.interface';

@Module({
  providers: [OtpService, { provide: OTP_SENDER, useClass: ConsoleOtpSender }],
  exports: [OtpService],
})
export class OtpModule {}
