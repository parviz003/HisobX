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
import { PrismaService } from '../../config/database/prisma.service';
import { RedisService } from '../../config/redis/redis.service';

const POLL_TIMEOUT_SECONDS = 25;
const RETRY_DELAY_MS = 3000;


@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private offset = 0;
  private running = false;

  constructor(
    private readonly links: TelegramLinkService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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

  /** Bitta yangilanish. */
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
      if (token && (token.startsWith('qr_') || token.startsWith('login_'))) {
        const qrToken = token.replace(/^(qr_|login_)/, '');
        await this.handleLoginQr(chatId, qrToken);
        return;
      }
      await this.links.handleStart(chatId, token);
    }
  }

  /**
   * QR kod skanerlanganda kompyuterdagi sessiyani tasdiqlaydi
   */
  private async handleLoginQr(chatId: number, qrToken: string) {
    if (!qrToken) return;
    const key = `auth:qr:${qrToken}`;
    const raw = await this.redis.client.get(key);

    if (!raw) {
      await TelegramApi.sendMessage(
        chatId,
        '⚠️ <b>Kirish havolasining muddati tugagan.</b>\n\nIltimos, kompyuter ekranida qaytadan kiring.',
      );
      return;
    }

    const data = JSON.parse(raw) as {
      userId: number;
      phone: string;
      status: string;
    };

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, fullName: true, telegramChatId: true },
    });

    if (!user || user.telegramChatId !== String(chatId)) {
      await TelegramApi.sendMessage(
        chatId,
        '⚠️ <b>Ruxsat berilmadi:</b> Ushbu HisobX hisobi sizning Telegramingizga biriktirilmagan.',
      );
      return;
    }

    // Redisda holatni tasdiqlangan qilamiz
    await this.redis.client.set(
      key,
      JSON.stringify({ ...data, status: 'confirmed' }),
      'EX',
      300,
    );

    await TelegramApi.sendMessage(
      chatId,
      `✅ <b>HisobX: Kirish tasdiqlandi!</b>\n\nSalom, <b>${user.fullName || 'Foydalanuvchi'}</b>!\nKompyuteringiz orqali tizimga muvaffaqiyatli kirdingiz.`,
    );
  }
}
