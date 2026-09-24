import { Controller, Get, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  MessageResponseDto,
} from '../../common/swagger';

@ApiTags('Notifications')
@Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Do'kon bildirishnomalari ro'yxati" })
  @ApiPaginatedSuccess(NotificationResponseDto, {
    description: 'Sahifalangan bildirishnomalar',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findAll(storeId, query);
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Barcha bildirishnomalarni o'qilgan deb belgilash" })
  @ApiSuccess(MessageResponseDto, { description: 'Barchasi yangilandi' })
  @ApiAuthErrors()
  markAllAsRead(@CurrentUser('storeId') storeId: number) {
    return this.notificationsService.markAllAsRead(storeId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: "Bitta bildirishnomani o'qilgan deb belgilash" })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiSuccess(NotificationResponseDto, { description: 'Bildirishnoma yangilandi' })
  @ApiError(404, 'NOT_FOUND', 'Bildirishnoma topilmadi')
  @ApiAuthErrors()
  markAsRead(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(storeId, id);
  }
}
