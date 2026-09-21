import { Controller, Post, Body } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { successRes } from '../../common/helper/success-response';

class TestNotificationDto {
  @ApiProperty({ example: 'Salom, bu test xabar' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@ApiTags('Telegram Notifications')
@Roles(Role.ADMIN)
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramNotificationService,
  ) {}

  @Post('test')
  @ApiOperation({ summary: 'Do‘kon telegram guruhiga test xabar yuborish' })
  async sendTest(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: TestNotificationDto,
  ) {
    return successRes({ message: 'Xabar muvaffaqiyatli jo‘natildi' });
  }

  @Post('trigger/debt-reminder')
  @ApiOperation({ summary: 'Qarzdorlik eslatmalarini qo‘lda ishga tushirish' })
  async triggerDebtReminder() {
    await this.telegramService.checkDebtReminders();
    return successRes({ message: 'Qarzlar eslatmasi bajarildi' });
  }

  @Post('trigger/low-stock')
  @ApiOperation({ summary: 'Kam qolgan mahsulotlar eslatmasini qo‘lda ishga tushirish' })
  async triggerLowStock() {
    await this.telegramService.checkLowStock();
    return successRes({ message: 'Kam qolgan tovarlar eslatmasi bajarildi' });
  }

  @Post('trigger/daily-summary')
  @ApiOperation({ summary: 'Kunlik yakuniy hisobotni qo‘lda yuborish' })
  async triggerDailySummary() {
    await this.telegramService.sendDailySummary();
    return successRes({ message: 'Kunlik hisobot yuborildi' });
  }
}
