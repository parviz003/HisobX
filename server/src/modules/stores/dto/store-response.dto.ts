import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class StoreResponseDto {
  @ApiProperty({ type: Number, example: 1 })
  id!: number;

  @ApiProperty({ type: String, example: 'Mening Do‘konim' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '+998901234567' })
  phone!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Toshkent, Chilonzor 5',
  })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '-1001234567890' })
  telegramChatId!: string | null;

  @ApiProperty({ type: Boolean, example: true })
  isActive!: boolean;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, example: '2026-09-21T09:00:00.000Z' })
  updatedAt!: Date;
}

export class StoreCountsDto {
  @ApiProperty({ type: Number, example: 4 })
  users!: number;

  @ApiProperty({ type: Number, example: 120 })
  products!: number;

  @ApiProperty({ type: Number, example: 350 })
  sales!: number;
}

/** `GET /stores` — har do'kon uchun qisqa statistika bilan */
export class StoreListItemResponseDto extends StoreResponseDto {
  @ApiProperty({ type: StoreCountsDto })
  _count!: StoreCountsDto;
}

/** `POST /stores/onboard` */
export class OnboardStoreResponseDto {
  @ApiProperty({ type: StoreResponseDto })
  store!: StoreResponseDto;

  @ApiProperty({
    type: UserResponseDto,
    description:
      "Yaratilgan do'kon menejeri (MANAGER, maxfiy maydonlarsiz). " +
      "Har do'konda aynan bitta MANAGER bo'ladi.",
  })
  manager!: UserResponseDto;
}

/** `PATCH /stores/:id/manager` */
export class TransferManagerResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'Yangi meneger' })
  manager!: UserResponseDto;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 7,
    description:
      "Avvalgi meneger IDsi (endi ADMIN). Meneger bo'lmagan bo'lsa null.",
  })
  previousManagerId!: number | null;
}
