import { z } from 'zod';

/** Backend formati: `+998901234567`. */
const phoneField = z
  .string()
  .trim()
  .regex(/^\+998\d{9}$/, 'validation.phone');

const passwordField = z.string().min(6, 'validation.passwordMin');

export const signInSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, 'validation.required'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'validation.otp'),
});
export type OtpValues = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({ phone: phoneField });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'validation.otp'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.required'),
  phone: phoneField,
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** Parol kuchliligi: 0–4 (UI'dagi ko'rsatkich uchun). */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score++;
  return Math.min(score, 4);
}
