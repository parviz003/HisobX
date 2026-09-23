import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { OtpModule } from '../otp/otp.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [OtpModule, TelegramModule],
  controllers: [AuthController, DeviceController],
  providers: [AuthService, DeviceService],
  exports: [AuthService, DeviceService],
})
export class AuthModule {}
