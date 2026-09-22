import {
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { UserId } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RefreshToken } from '../../common/decorators/get-cookie.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Devices')
@UseGuards(AuthGuard, RolesGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchining faol qurilmalarini olish' })
  findAll(@UserId() userId: number) {
    return this.deviceService.findAll(userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Eski qurilmani o'chirish (24 soatdan so'ng mumkin)",
  })
  remove(
    @RefreshToken() refreshToken: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deviceService.remove(refreshToken, id);
  }
}
