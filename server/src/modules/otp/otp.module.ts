import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { TelegramOtpSender } from './telegram-otp-sender';
import { OTP_SENDER } from './otp-sender.interface';

@Module({
  // Kodlar SMS emas, Telegram bot orqali yuboriladi (topshiriq 1-bo'lim).
  providers: [OtpService, { provide: OTP_SENDER, useClass: TelegramOtpSender }],
  exports: [OtpService],
})
export class OtpModule {}
