import type { OtpPurpose } from './otp.service';

/** OTP yetkazib beruvchi provayder uchun DI tokeni */
export const OTP_SENDER = Symbol('OTP_SENDER');

/**
 * OTP kodini foydalanuvchiga yetkazish shartnomasi.
 * Yangi provayder (SMS, Telegram, email) shu interfeysni implement qiladi.
 */
export interface OtpSender {
  send(phone: string, code: string, purpose: OtpPurpose): Promise<void>;
}
