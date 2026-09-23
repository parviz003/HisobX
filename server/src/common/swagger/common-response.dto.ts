import { ApiProperty } from '@nestjs/swagger';

/** `data: { message }` shaklidagi oddiy javoblar uchun */
export class MessageResponseDto {
  @ApiProperty({ type: String, example: 'Amal bajarildi' })
  message!: string;
}

/** O'chirish amallari: xabar va o'chirilgan yozuv IDsi */
export class DeletedResponseDto extends MessageResponseDto {
  @ApiProperty({ type: Number, example: 12 })
  id!: number;
}

/**
 * Barcha ro'yxat endpointlarida bir xil `meta` bloki.
 * Javob shakli: `{ statusCode, data: { items, meta } }`.
 */
export class PaginationMetaDto {
  @ApiProperty({ type: Number, example: 42, description: 'Jami yozuvlar soni' })
  total!: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Joriy sahifa (1 dan)',
  })
  page!: number;

  @ApiProperty({ type: Number, example: 20, description: 'Sahifa hajmi' })
  limit!: number;

  @ApiProperty({ type: Number, example: 3, description: 'Jami sahifalar soni' })
  totalPages!: number;
}
