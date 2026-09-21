import { Module } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramController } from './telegram.controller';

@Module({
  controllers: [TelegramController],
  providers: [TelegramNotificationService],
  exports: [TelegramNotificationService],
})
export class TelegramModule {}
