import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';

/** `POST /auth/signin`, `POST /auth/resend-otp` */
export class OtpSentResponseDto {
  @ApiProperty({ type: String, example: '+998901234567' })
  phone!: string;

  @ApiProperty({ type: String, example: 'Tasdiqlash kodi yuborildi' })
  message!: string;

  @ApiPropertyOptional({
    type: String,
    example: '123456',
    description: 'Faqat development muhitida qaytariladi',
  })
  code?: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:01:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:01:00.000Z' })
  resendAvailableAt!: string;
}

/** `POST /auth/forgot-password` — raqam mavjudligini oshkor qilmaydi */
export class ForgotPasswordResponseDto {
  @ApiProperty({ type: String, example: '+998901234567' })
  phone!: string;

  @ApiProperty({
    type: String,
    example: "Agar bu raqam tizimda mavjud bo'lsa, tasdiqlash kodi yuborildi",
  })
  message!: string;

  @ApiPropertyOptional({ type: String, example: '123456' })
  code?: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:01:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:01:00.000Z' })
  resendAvailableAt!: string;
}

/** `POST /auth/confirm` — cookie'lar o'rnatiladi, token body'da qaytmaydi */
export class ConfirmSignInResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  userId!: number;

  @ApiProperty({ type: Number, example: 5 })
  deviceId!: number;

  @ApiProperty({ type: String, example: 'Chrome Android' })
  device!: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role!: Role;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  storeId!: number | null;

  @ApiProperty({ type: String, example: '+998901234567' })
  phone!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Alisher Valiyev' })
  fullName!: string | null;

  @ApiProperty({ type: String, example: '2026-09-23T09:00:00.000Z' })
  createdAt!: Date;
}

/** `POST /auth/refresh` */
export class RefreshResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  userId!: number;

  @ApiProperty({ type: Number, example: 5 })
  deviceId!: number;

  @ApiProperty({ type: String, example: 'Chrome Android' })
  device!: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:00:00.000Z' })
  createdAt!: Date;
}

/** `POST /auth/signup` */
export class SignUpResponseDto {
  @ApiProperty({
    type: String,
    example: "Do'kon va administrator muvaffaqiyatli yaratildi",
  })
  message!: string;

  @ApiProperty({ type: Number, example: 1 })
  storeId!: number;

  @ApiProperty({ type: Number, example: 2 })
  userId!: number;
}

/** Qurilma limiti xatosidagi (`DEVICE_LIMIT_REACHED`) va `GET /device` javobidagi qurilma */
export class DeviceResponseDto {
  @ApiProperty({ type: Number, example: 5 })
  deviceId!: number;

  @ApiProperty({ type: String, example: 'Chrome Android' })
  device!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Chrome' })
  browser!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Android' })
  os!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'smartphone',
    description: 'smartphone | tablet | desktop | ...',
  })
  deviceType!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '213.230.108.4' })
  ip!: string | null;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    example: '2026-09-23T09:00:00.000Z',
    description: 'Har refresh va har kirishda yangilanadi',
  })
  lastActiveAt!: Date;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: "So'rov yuborilayotgan qurilmami",
  })
  isCurrent!: boolean;

  @ApiProperty({
    type: String,
    example: '2026-09-22T09:00:00.000Z',
    description:
      "Shu vaqtdan boshlab qurilmani o'chirish mumkin (qo'shilgandan 24 soat o'tgach)",
  })
  canRemoveAt!: string;
}

/** `DELETE /device/:id` */
export class DeviceRemovedResponseDto {
  @ApiProperty({ type: String, example: "Qurilma o'chirildi" })
  message!: string;

  @ApiProperty({ type: Number, example: 5 })
  deviceId!: number;
}

/** Hisob holati (ichki foydalanish uchun eksport) */
export class AccountStatusDto {
  @ApiProperty({ enum: Status })
  status!: Status;
}
