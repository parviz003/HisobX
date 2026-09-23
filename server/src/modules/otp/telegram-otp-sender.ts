import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { env } from '../../config';
import { Phone } from '../../common/helper/phone';
import { TelegramApi } from '../../infrastructure/lib/TelegramApi';
import { otpMessage } from '../telegram/telegram-messages';
import type { OtpSender } from './otp-sender.interface';
import type { OtpPurpose } from './otp.service';

/**
 * OTP kodlarni Telegram bot orqali yuboradi (SMS yo'q).
 *
 * Hisob botga ulanmagan bo'lsa kod yuborilmaydi — bu holatni sign-in oqimi
 * oldindan aniqlaydi va foydalanuvchiga ulash havolasini beradi. Bot tokeni
 * sozlanmagan development'da kod logga yoziladi, aks holda umuman chiqmaydi.
 */
@Injectable()
export class TelegramOtpSender implements OtpSender {
  private readonly logger = new Logger(TelegramOtpSender.name);

  constructor(private readonly db: PrismaService) {}

  async send(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { phone: Phone.normalize(phone) },
      select: { telegramChatId: true },
    });

    if (user?.telegramChatId) {
      await TelegramApi.sendMessage(
        user.telegramChatId,
        otpMessage(code, env.OTP.TTL_SECONDS),
      );
      return;
    }

    if (env.IS_DEV) {
      this.logger.log(
        `[LOCAL OTP] purpose=${purpose} ${phone} -> ${code} (Telegram ulanmagan)`,
      );
      return;
    }
    this.logger.warn('OTP yuborilmadi: hisob Telegramga ulanmagan');
  }
}
