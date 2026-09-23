import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/** `PATCH /stores/:id/manager` — menejerlikni boshqa xodimga o'tkazish */
export class TransferManagerDto {
  @ApiProperty({
    type: Number,
    example: 12,
    description:
      "Yangi menejer bo'ladigan foydalanuvchi IDsi. Shu do'konning xodimi bo'lishi shart.",
  })
  @IsInt()
  @IsPositive()
  userId!: number;
}
