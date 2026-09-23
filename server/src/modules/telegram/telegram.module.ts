import { Module } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramController } from './telegram.controller';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramBotService } from './telegram-bot.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [OtpModule],
  controllers: [TelegramController],
  providers: [
    TelegramNotificationService,
    TelegramLinkService,
    TelegramBotService,
  ],
  exports: [TelegramNotificationService, TelegramLinkService],
})
export class TelegramModule {}
