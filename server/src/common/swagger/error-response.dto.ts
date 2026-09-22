import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Loyihadagi barcha xato javoblarining yagona shakli */
export class ErrorResponseDto {
  @ApiProperty({ type: Number, example: 409 })
  statusCode!: number;

  @ApiProperty({
    type: String,
    example: "Inson o'qiy oladigan matn",
    description: 'Foydalanuvchiga ko‘rsatish uchun matn (o‘zbekcha)',
  })
  message!: string;

  @ApiProperty({
    type: String,
    example: 'MACHINE_CODE',
    description:
      'Barqaror mashina kodi. Frontend mantiqini aynan shu kodga bog‘lang, matnga emas.',
  })
  code!: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    description: "Xatoga oid qo'shimcha ma'lumot (kodga qarab turlicha)",
    example: null,
  })
  data?: Record<string, unknown> | null;

  @ApiProperty({ type: String, example: '2026-09-23T09:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ type: String, example: '/api/v1/auth/signin' })
  path!: string;
}
