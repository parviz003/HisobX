import { Logger } from '@nestjs/common';
import { env } from '../../config';

/** Telegram `Update` obyektining bizga kerak bo'lgan qismi */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; is_bot?: boolean };
    chat: { id: number; type: string };
    text?: string;
    contact?: {
      phone_number: string;
      /** Kontakt EGASINING Telegram IDsi. Begona kontaktda bu maydon boshqa bo'ladi. */
      user_id?: number;
    };
  };
}

type ReplyMarkup = {
  keyboard?: { text: string; request_contact?: boolean }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  remove_keyboard?: boolean;
};

/**
 * Telegram Bot API bilan ishlash — bog'liqliksiz (faqat `fetch`).
 *
 * Alohida sinf sifatida turadi, chunki uni ham OTP yuboruvchi, ham bot
 * xizmati ishlatadi; DI grafida halqa hosil bo'lmasligi uchun provayder emas.
 */
export class TelegramApi {
  private static readonly logger = new Logger(TelegramApi.name);

  static get isConfigured(): boolean {
    return Boolean(env.TELEGRAM.TOKEN);
  }

  /** `https://t.me/<bot>?start=<token>` — hisobni ulash havolasi */
  static startUrl(token: string): string {
    const username = env.TELEGRAM.BOT_USERNAME.replace(/^@/, '');
    return `https://t.me/${username}?start=${token}`;
  }

  private static async call<T>(
    method: string,
    payload: Record<string, unknown>,
  ): Promise<T | null> {
    if (!this.isConfigured) return null;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM.TOKEN}/${method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json()) as { ok: boolean; result?: T };
      if (!body.ok) {
        this.logger.warn(`Telegram ${method} rad etdi`);
        return null;
      }
      return body.result ?? null;
    } catch (error) {
      this.logger.error(
        `Telegram ${method} xatosi: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** Xabar yuboradi. Token sozlanmagan bo'lsa `false` qaytaradi (ilova yiqilmaydi). */
  static async sendMessage(
    chatId: string | number,
    text: string,
    replyMarkup?: ReplyMarkup,
  ): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`[LOCAL TELEGRAM] chat=${chatId}\n${text}`);
      return false;
    }

    const result = await this.call<unknown>('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
    return result !== null;
  }

  /** Long polling. `offset` — oxirgi o'qilgan `update_id` + 1. */
  static async getUpdates(
    offset: number,
    timeoutSeconds: number,
  ): Promise<TelegramUpdate[]> {
    const result = await this.call<TelegramUpdate[]>('getUpdates', {
      offset,
      timeout: timeoutSeconds,
      allowed_updates: ['message'],
    });
    return result ?? [];
  }

  /** "Raqamni ulashish" tugmasi — foydalanuvchi faqat O'Z kontaktini yubora oladi. */
  static shareContactKeyboard(buttonText: string): ReplyMarkup {
    return {
      keyboard: [[{ text: buttonText, request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  static removeKeyboard(): ReplyMarkup {
    return { remove_keyboard: true };
  }
}
