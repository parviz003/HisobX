import {
  Controller,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramLinkService } from './telegram-link.service';
import { PrismaService } from '../../config/database/prisma.service';
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
import { IPayload } from '../../common/interface';

class TestNotificationDto {
  @ApiProperty({ example: 'Salom, bu test xabar' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

class TelegramInviteResponseDto {
  @ApiProperty({ type: String, example: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' })
  linkToken!: string;

  @ApiProperty({
    type: String,
    example: 'https://t.me/hisobx_bot?start=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  })
  botUrl!: string;

  @ApiProperty({ type: String, example: '2026-09-23T09:10:00.000Z' })
  linkExpiresAt!: string;
}

@ApiTags('Telegram Notifications')
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramNotificationService,
    private readonly telegramLinkService: TelegramLinkService,
    private readonly prisma: PrismaService,
  ) {}

  @Roles(Role.ADMIN, Role.MANAGER, Role.SELLER, Role.SUPERADMIN)
  @Post('invite')
  @ApiOperation({
    summary: 'Foydalanuvchi hisobiga Telegram ulash havolasini olish',
  })
  @ApiSuccess(TelegramInviteResponseDto, { description: 'Telegram ulash havolasi' })
  @ApiAuthErrors()
  async createInvite(@CurrentUser() actor: IPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: { id: true, phone: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    const invite = await this.telegramLinkService.createInvite(user);
    return successRes(invite);
  }

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('test')
  @ApiOperation({
    summary: `Do'kon telegram guruhiga test xabar yuborish`,
    description:
      "Do'konning `telegramChatId` maydoni yoki xodimlar telegrami sozlangan bo'lishi kerak.",
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

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('trigger/debt-reminder')
  @ApiOperation({ summary: 'Qarzdorlik eslatmalarini qo‘lda ishga tushirish' })
  @ApiSuccess(MessageResponseDto, { description: 'Bajarildi' })
  @ApiAuthErrors()
  async triggerDebtReminder() {
    await this.telegramService.checkDebtReminders();
    return successRes({ message: 'Qarzlar eslatmasi bajarildi' });
  }

  @Roles(Role.ADMIN, Role.MANAGER)
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

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('trigger/daily-summary')
  @ApiOperation({ summary: 'Kunlik yakuniy hisobotni qo‘lda yuborish' })
  @ApiSuccess(MessageResponseDto, { description: 'Bajarildi' })
  @ApiAuthErrors()
  async triggerDailySummary() {
    await this.telegramService.sendDailySummary();
    return successRes({ message: 'Kunlik hisobot yuborildi' });
  }
}
