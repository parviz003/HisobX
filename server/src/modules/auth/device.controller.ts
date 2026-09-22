import {
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RefreshToken } from '../../common/decorators/get-cookie.decorator';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { IPayload } from '../../common/interface';
import { ApiAuthErrors, ApiError, ApiSuccess } from '../../common/swagger';
import {
  DeviceRemovedResponseDto,
  DeviceResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Devices')
@UseGuards(AuthGuard, RolesGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ApiOperation({
    summary: 'Foydalanuvchining faol qurilmalarini olish',
    description:
      "Qurilmalar oxirgi faollik bo'yicha saralanadi. `isCurrent` — shu so'rov" +
      " yuborilgan qurilma. `canRemoveAt` — qurilmani o'chirish mumkin bo'ladigan payt.",
  })
  @ApiSuccess(DeviceResponseDto, {
    isArray: true,
    description: "Qurilmalar ro'yxati",
  })
  @ApiAuthErrors()
  findAll(@CurrentUser() actor: IPayload) {
    return this.deviceService.findAll(actor.sub, actor.deviceId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Eski qurilmani o'chirish",
    description:
      "Qurilmani u qo'shilgandan 24 soat o'tgachgina o'chirish mumkin." +
      " Faqat o'z qurilmangizni o'chira olasiz; joriy qurilma o'chirilmaydi.",
  })
  @ApiParam({ name: 'id', type: Number, example: 5 })
  @ApiSuccess(DeviceRemovedResponseDto, { description: "Qurilma o'chirildi" })
  @ApiError(
    400,
    ['DEVICE_REMOVAL_TOO_EARLY', 'DEVICE_CURRENT_CANNOT_BE_REMOVED'],
    "24 soat to'lmagan yoki joriy qurilma",
    {
      type: 'object',
      properties: {
        canRemoveAt: {
          type: 'string',
          example: '2026-09-23T09:00:00.000Z',
          description: 'Faqat DEVICE_REMOVAL_TOO_EARLY uchun',
        },
      },
    },
  )
  @ApiError(401, 'REFRESH_TOKEN_MISSING', 'Sessiya topilmadi')
  @ApiError(404, 'DEVICE_NOT_FOUND', 'Qurilma topilmadi')
  remove(
    @RefreshToken() refreshToken: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deviceService.remove(refreshToken, id);
  }
}
