import type { OtpPurpose } from './otp.service';

/** OTP yetkazib beruvchi provayder uchun DI tokeni */
export const OTP_SENDER = Symbol('OTP_SENDER');

export interface OtpSender {
  send(phone: string, code: string, purpose: OtpPurpose): Promise<void>;
}
