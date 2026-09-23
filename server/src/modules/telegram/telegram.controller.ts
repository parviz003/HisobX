import { Controller, Post, Body } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiSuccess,
  ApiValidationError,
  MessageResponseDto,
} from '../../common/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { successRes } from '../../common/helper/success-response';

class TestNotificationDto {
  @ApiProperty({ example: 'Salom, bu test xabar' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@ApiTags('Telegram Notifications')
@Roles(Role.MANAGER)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramNotificationService) {}

  @Post('test')
  @ApiOperation({
    summary: `Do'kon telegram guruhiga test xabar yuborish`,
    description:
      "Do'konning `telegramChatId` maydoni sozlangan bo'lishi kerak," +
      ' aks holda 400 qaytadi. Telegram xabarni qabul qilmasa — 503.',
  })
  @ApiSuccess(MessageResponseDto, { description: 'Xabar yuborildi' })
  @ApiValidationError()
  @ApiError(400, 'BAD_REQUEST', 'telegramChatId sozlanmagan')
  @ApiError(503, 'SERVICE_UNAVAILABLE', "Telegramga xabar yuborib bo'lmadi")
  @ApiAuthErrors()
  async sendTest(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: TestNotificationDto,
  ) {
    const result = await this.telegramService.sendTestMessage(
      storeId,
      dto.message,
    );
    return successRes(result);
  }

  @Post('trigger/debt-reminder')
  @ApiOperation({ summary: 'Qarzdorlik eslatmalarini qo‘lda ishga tushirish' })
  @ApiSuccess(MessageResponseDto, { description: 'Bajarildi' })
  @ApiAuthErrors()
  async triggerDebtReminder() {
    await this.telegramService.checkDebtReminders();
    return successRes({ message: 'Qarzlar eslatmasi bajarildi' });
  }

  @Post('trigger/low-stock')
  @ApiOperation({
    summary: 'Kam qolgan mahsulotlar eslatmasini qo‘lda ishga tushirish',
  })
  @ApiSuccess(MessageResponseDto, { description: 'Bajarildi' })
  @ApiAuthErrors()
  async triggerLowStock() {
    await this.telegramService.checkLowStock();
    return successRes({ message: 'Kam qolgan tovarlar eslatmasi bajarildi' });
  }

  @Post('trigger/daily-summary')
  @ApiOperation({ summary: 'Kunlik yakuniy hisobotni qo‘lda yuborish' })
  @ApiSuccess(MessageResponseDto, { description: 'Bajarildi' })
  @ApiAuthErrors()
  async triggerDailySummary() {
    await this.telegramService.sendDailySummary();
    return successRes({ message: 'Kunlik hisobot yuborildi' });
  }
}
