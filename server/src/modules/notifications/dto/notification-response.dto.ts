import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: NotificationType, example: NotificationType.LOW_STOCK })
  type!: NotificationType;

  @ApiProperty({ example: 'Kam qolgan mahsulot' })
  title!: string;

  @ApiProperty({
    example: "'Ahmad Tea Ceylon 100g' qoldig'i 2 dona qoldi (minimal: 5).",
  })
  message!: string;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ example: true })
  isSent!: boolean;

  @ApiProperty({ example: 3 })
  storeId!: number;

  @ApiProperty({ example: '2026-09-23T12:00:00.000Z' })
  createdAt!: Date;
}
