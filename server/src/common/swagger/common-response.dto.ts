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

/** Sahifalangan ro'yxatlarning umumiy maydonlari */
export class PaginationMetaDto {
  @ApiProperty({ type: Number, example: 42, description: 'Jami yozuvlar soni' })
  total!: number;

  @ApiProperty({ type: Number, example: 1 })
  page!: number;

  @ApiProperty({ type: Number, example: 10 })
  limit!: number;
}
