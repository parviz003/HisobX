import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';

/** Do'kon haqida qisqa ma'lumot (profil javobida) */
export class UserStoreDto {
  @ApiProperty({ type: Number, example: 1 })
  id!: number;

  @ApiProperty({ type: String, example: 'Mening Do‘konim' })
  name!: string;
}

/** Foydalanuvchi — parol va boshqa maxfiy maydonlarsiz */
export class UserResponseDto {
  @ApiProperty({ type: Number, example: 2 })
  id!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Alisher Valiyev' })
  fullName!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  name!: string | null;

  @ApiProperty({
    type: String,
    example: '+998901234567',
    description: 'Har doim E.164 formatida',
  })
  phone!: string;

  @ApiProperty({ enum: Role, example: Role.SELLER })
  role!: Role;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status!: Status;

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'http://localhost:3000/api/v1/uploads/1758.webp',
  })
  imageUrl!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 1 })
  storeId!: number | null;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

/** `GET /users/me` — foydalanuvchi + do'koni */
export class UserProfileResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ type: UserStoreDto, nullable: true })
  store?: UserStoreDto | null;
}

/** `PATCH /users/:id/password` */
export class UserPasswordResetResponseDto extends UserResponseDto {
  @ApiProperty({
    type: String,
    example: 'Parol tiklandi, barcha sessiyalar bekor qilindi',
  })
  message!: string;
}

/** `PATCH /users/me/password` */
export class ChangePasswordResponseDto {
  @ApiProperty({
    type: String,
    example:
      'Parol yangilandi. Joriy qurilmadan tashqari barcha sessiyalar bekor qilindi',
  })
  message!: string;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Bekor qilingan sessiyalar soni',
  })
  revokedSessions!: number;
}
