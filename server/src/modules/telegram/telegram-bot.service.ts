import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { env } from '../../config';
import {
  TelegramApi,
  type TelegramUpdate,
} from '../../infrastructure/lib/TelegramApi';
import { TelegramLinkService } from './telegram-link.service';

/** Long polling oynasi (sekund) — Telegram tavsiya etgan oraliq. */
const POLL_TIMEOUT_SECONDS = 25;
/** Xatodan keyin qayta urinishdan oldingi kutish (ms) */
const RETRY_DELAY_MS = 3000;

/**
 * Botning yangilanishlarini o'qiydi (localhost uchun polling).
 *
 * Token sozlanmagan bo'lsa ilova YIQILMAYDI — ogohlantirish logi bilan
 * botsiz ishlayveradi (topshiriq B-5).
 */
@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private offset = 0;
  private running = false;

  constructor(private readonly links: TelegramLinkService) {}

  onModuleInit() {
    if (!TelegramApi.isConfigured) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN sozlanmagan — bot ishga tushmadi, OTP kodlar logga yoziladi',
      );
      return;
    }
    if (env.TELEGRAM.MODE !== 'polling') {
      this.logger.log(
        `TELEGRAM_MODE=${env.TELEGRAM.MODE} — polling o'chirilgan`,
      );
      return;
    }
    if (!env.TELEGRAM.BOT_USERNAME) {
      this.logger.warn(
        "TELEGRAM_BOT_USERNAME sozlanmagan — ulash havolasi noto'g'ri bo'ladi",
      );
    }

    this.running = true;
    void this.loop();
    this.logger.log('Telegram bot polling rejimida ishga tushdi');
  }

  onModuleDestroy() {
    this.running = false;
  }

  private async loop() {
    while (this.running) {
      try {
        const updates = await TelegramApi.getUpdates(
          this.offset,
          POLL_TIMEOUT_SECONDS,
        );
        for (const update of updates) {
          this.offset = Math.max(this.offset, update.update_id + 1);
          await this.handle(update);
        }
      } catch (error) {
        this.logger.error(`Polling xatosi: ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  /** Bitta yangilanish. Bot faqat `/start` va kontaktga javob beradi. */
  async handle(update: TelegramUpdate) {
    const message = update.message;
    if (!message || message.from?.is_bot) return;

    const chatId = message.chat.id;

    if (message.contact) {
      await this.links.handleContact({
        chatId,
        fromId: message.from?.id ?? 0,
        contactUserId: message.contact.user_id,
        phoneNumber: message.contact.phone_number,
      });
      return;
    }

    if (message.text?.startsWith('/start')) {
      const token = message.text.split(/\s+/)[1];
      await this.links.handleStart(chatId, token);
    }
  }
}
