import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../config/database/prisma.service';
import { RedisService } from '../../config/redis/redis.service';
import { env } from '../../config';
import { Phone } from '../../common/helper/phone';
import { TelegramApi } from '../../infrastructure/lib/TelegramApi';
import { OtpService } from '../otp/otp.service';
import { BOT_TEXT } from './telegram-messages';

/** `POST /auth/signin` javobi — hisob hali ulanmagan bo'lsa */
export interface TelegramLinkInvite {
  linkToken: string;
  botUrl: string;
  linkExpiresAt: string;
}

/** `GET /auth/telegram-link-status` javobi */
export interface TelegramLinkStatus {
  linked: boolean;
  expiresAt?: string;
  resendAvailableAt?: string;
}

type LinkTokenPayload = { userId: number; phone: string };

/**
 * Foydalanuvchi hisobini Telegram chatiga bog'lash.
 *
 * Token Redis'da yashaydi (TTL 10 daqiqa) va faqat bitta marta ishlatiladi.
 * Bog'lanish muvaffaqiyatli bo'lsa OTP darhol botga yuboriladi va uning
 * muddatlari alohida kalitda saqlanadi — frontend `link-status` orqali
 * kutib turgani uchun.
 */
@Injectable()
export class TelegramLinkService {
  private readonly logger = new Logger(TelegramLinkService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisService,
    private readonly otp: OtpService,
  ) {}

  private tokenKey(token: string) {
    return `tg:link:${token}`;
  }

  private resultKey(token: string) {
    return `tg:link:result:${token}`;
  }

  /** Ulash havolasi va tokenini yaratadi. */
  async createInvite(user: {
    id: number;
    phone: string;
  }): Promise<TelegramLinkInvite> {
    const token = randomBytes(16).toString('hex');
    const ttl = env.TELEGRAM.LINK_TTL_SECONDS;
    const payload: LinkTokenPayload = { userId: user.id, phone: user.phone };

    await this.redis.client.set(
      this.tokenKey(token),
      JSON.stringify(payload),
      'EX',
      ttl,
    );

    return {
      linkToken: token,
      botUrl: TelegramApi.startUrl(token),
      linkExpiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  }

  /**
   * Ulanish holati. Frontend shu yerni 2 soniyada bir so'rab turadi.
   * Token noto'g'ri yoki eskirgan bo'lsa ham `linked: false` qaytadi —
   * tokenning mavjudligi oshkor qilinmaydi.
   */
  async status(token: string): Promise<TelegramLinkStatus> {
    const raw = await this.redis.client.get(this.resultKey(token));
    if (!raw) return { linked: false };

    const result = JSON.parse(raw) as {
      expiresAt: string;
      resendAvailableAt: string;
    };
    return { linked: true, ...result };
  }

  /**
   * Bot `/start <token>` ni qabul qildi: tokenni tekshirib, kontakt so'raydi.
   * Token yaroqsiz bo'lsa ham bot javob beradi, lekin hech narsa ochilmaydi.
   */
  async handleStart(chatId: number, token: string | undefined) {
    if (!token) {
      await TelegramApi.sendMessage(chatId, BOT_TEXT.startWithoutToken);
      return;
    }

    const payload = await this.readToken(token);
    if (!payload) {
      await TelegramApi.sendMessage(chatId, BOT_TEXT.linkExpired);
      return;
    }

    // Token chatga biriktiriladi: kontakt kelganda qaysi token ekani ma'lum bo'lsin.
    await this.redis.client.set(
      `tg:chat:${chatId}`,
      token,
      'EX',
      env.TELEGRAM.LINK_TTL_SECONDS,
    );

    await TelegramApi.sendMessage(
      chatId,
      BOT_TEXT.askContact,
      TelegramApi.shareContactKeyboard(BOT_TEXT.shareButton),
    );
  }

  /**
   * Kontakt kelganda hisobni bog'laydi.
   *
   * QAT'IY ikki shart: kontakt yuboruvchining O'ZINIKI bo'lishi
   * (`contact.user_id === from.id`) va raqam token egasiniki bilan mos kelishi.
   * Aks holda birov boshqaning raqamini yuborib, uning kodini o'z chatiga
   * olib ketishi mumkin bo'lardi.
   */
  async handleContact(input: {
    chatId: number;
    fromId: number;
    contactUserId?: number;
    phoneNumber: string;
  }) {
    const { chatId, fromId, contactUserId, phoneNumber } = input;

    if (!contactUserId || contactUserId !== fromId) {
      await TelegramApi.sendMessage(
        chatId,
        BOT_TEXT.foreignContact,
        TelegramApi.removeKeyboard(),
      );
      return;
    }

    const token = await this.redis.client.get(`tg:chat:${chatId}`);
    const payload = token ? await this.readToken(token) : null;
    if (!token || !payload) {
      await TelegramApi.sendMessage(
        chatId,
        BOT_TEXT.linkExpired,
        TelegramApi.removeKeyboard(),
      );
      return;
    }

    if (Phone.normalize(phoneNumber) !== Phone.normalize(payload.phone)) {
      await TelegramApi.sendMessage(
        chatId,
        BOT_TEXT.phoneMismatch,
        TelegramApi.removeKeyboard(),
      );
      return;
    }

    await this.link(payload.userId, chatId);

    // Token bir martalik — ishlatilgach darhol o'chadi.
    await this.redis.client.del(this.tokenKey(token), `tg:chat:${chatId}`);

    await TelegramApi.sendMessage(
      chatId,
      BOT_TEXT.linked,
      TelegramApi.removeKeyboard(),
    );

    // Kod darhol yuboriladi — foydalanuvchi ilovaga qaytganda kutib turmasin.
    const otp = await this.otp.sendOtp(payload.phone, 'signin');
    await this.otp.markPending(payload.phone, 'signin');

    await this.redis.client.set(
      this.resultKey(token),
      JSON.stringify({
        expiresAt: otp.expiresAt,
        resendAvailableAt: otp.resendAvailableAt,
      }),
      'EX',
      env.TELEGRAM.LINK_TTL_SECONDS,
    );
  }

  /** Chatni foydalanuvchiga biriktiradi. Bitta chat — bitta hisob. */
  private async link(userId: number, chatId: number) {
    const chat = String(chatId);

    await this.db.$transaction([
      // Bu chat avval boshqa hisobga ulangan bo'lsa, eski bog'lanish uziladi.
      this.db.user.updateMany({
        where: { telegramChatId: chat, id: { not: userId } },
        data: { telegramChatId: null, telegramLinkedAt: null },
      }),
      this.db.user.update({
        where: { id: userId },
        data: { telegramChatId: chat, telegramLinkedAt: new Date() },
      }),
    ]);

    this.logger.log(`Telegram ulandi: userId=${userId}`);
  }

  private async readToken(token: string): Promise<LinkTokenPayload | null> {
    const raw = await this.redis.client.get(this.tokenKey(token));
    if (!raw) return null;
    return JSON.parse(raw) as LinkTokenPayload;
  }
}
