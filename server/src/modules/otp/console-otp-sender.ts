import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config';
import type { OtpSender } from './otp-sender.interface';
import type { OtpPurpose } from './otp.service';

/**
 * Vaqtinchalik implementatsiya: haqiqiy provayder ulanmaguncha ishlaydi.
 * Kod faqat development'da logga yoziladi, production'da hech qayerga chiqmaydi.
 */
@Injectable()
export class ConsoleOtpSender implements OtpSender {
  private readonly logger = new Logger(ConsoleOtpSender.name);

  async send(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    if (!env.IS_DEV) {
      this.logger.warn('OTP yuboruvchi sozlanmagan');
      return;
    }

    this.logger.log(
      `[LOCAL OTP] purpose=${purpose} Qabul qiluvchi: ${phone} -> Kod: ${code}`,
    );
  }
}
