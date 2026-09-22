import {
  Res,
  Body,
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { PhoneDto } from './dto/phone.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOTPDto } from '../otp/dto/verify-otp.dto';
import type { Response, Request } from 'express';
import { RefreshToken } from '../../common/decorators/get-cookie.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { StrictRateLimit } from '../../common/decorators/throttle.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: "Yangi do'kon va administratorni ro'yxatdan o'tkazish",
  })
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @StrictRateLimit()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish (OTP yuboriladi)' })
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Public()
  @StrictRateLimit()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OTP kodni tasdiqlash va kirish (Cookie o‘rnatiladi)',
  })
  confirmSignIn(
    @Body() dto: VerifyOTPDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.confirmSignIn(dto, req, res);
  }

  @Public()
  @StrictRateLimit()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Sign-in OTP kodini qayta yuborish (parol tekshiruvidan o'tgan urinish uchun)",
  })
  resendOtp(@Body() dto: PhoneDto) {
    return this.authService.resendSignInOtp(dto.phone);
  }

  @Public()
  @StrictRateLimit()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Parolni tiklash uchun OTP so'rash (javob raqam mavjudligini oshkor qilmaydi)",
  })
  forgotPassword(@Body() dto: PhoneDto) {
    return this.authService.forgotPassword(dto.phone);
  }

  @Public()
  @StrictRateLimit()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OTP bilan parolni tiklash (barcha sessiyalar bekor qilinadi)',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni yangilash' })
  refreshToken(
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(refreshToken, res);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tizimdan chiqish va qurilma sessiyasini o‘chirish',
  })
  signOut(
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(refreshToken, res);
  }
}
