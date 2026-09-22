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
import {
  ConfirmSignInResponseDto,
  DeviceResponseDto,
  ForgotPasswordResponseDto,
  OtpSentResponseDto,
  RefreshResponseDto,
  SignUpResponseDto,
} from './dto/auth-response.dto';
import { VerifyOTPDto } from '../otp/dto/verify-otp.dto';
import type { Response, Request } from 'express';
import { RefreshToken } from '../../common/decorators/get-cookie.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { StrictRateLimit } from '../../common/decorators/throttle.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiError,
  ApiSuccess,
  ApiValidationError,
  MessageResponseDto,
} from '../../common/swagger';

@ApiTags('Auth')
@ApiExtraModels(DeviceResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: "Yangi do'kon va administratorni ro'yxatdan o'tkazish",
  })
  @ApiSuccess(SignUpResponseDto, {
    status: 201,
    description: "Do'kon yaratildi",
  })
  @ApiValidationError()
  @ApiError(409, 'PHONE_TAKEN', 'Telefon raqam band')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @StrictRateLimit()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish (OTP yuboriladi)' })
  @ApiSuccess(OtpSentResponseDto, {
    description: "Parol to'g'ri, tasdiqlash kodi yuborildi",
  })
  @ApiValidationError()
  @ApiError(400, 'INVALID_CREDENTIALS', 'Telefon raqam yoki parol xato')
  @ApiError(403, 'ACCOUNT_INACTIVE', 'Hisob bloklangan')
  @ApiError(
    429,
    ['LOGIN_BLOCKED', 'OTP_RESEND_TOO_SOON', 'TOO_MANY_REQUESTS'],
    'Ketma-ket xato urinishlar yoki cooldown. `Retry-After` headeri qaytadi',
    {
      type: 'object',
      properties: { retryAfter: { type: 'integer', example: 45 } },
    },
  )
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Public()
  @StrictRateLimit()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "OTP kodni tasdiqlash va kirish (Cookie o'rnatiladi)",
    description:
      'Muvaffaqiyatda `accessToken` va `refreshToken` httpOnly cookie sifatida' +
      " yoziladi — javob body'sida token qaytarilmaydi.",
  })
  @ApiSuccess(ConfirmSignInResponseDto, {
    description: 'Kirish muvaffaqiyatli',
  })
  @ApiValidationError()
  @ApiError(
    400,
    ['OTP_INVALID', 'OTP_EXPIRED', 'OTP_NOT_PENDING'],
    'Kod xato yoki eskirgan',
    {
      type: 'object',
      properties: {
        attemptsLeft: {
          type: 'integer',
          example: 2,
          description: 'Faqat OTP_INVALID uchun',
        },
      },
    },
  )
  @ApiError(
    403,
    ['DEVICE_LIMIT_REACHED', 'ACCOUNT_INACTIVE'],
    "Qurilmalar limiti to'ldi — `data.devices` ro'yxatidan birini o'chirish kerak",
    {
      type: 'object',
      properties: {
        limit: { type: 'integer', example: 3 },
        devices: {
          type: 'array',
          items: { $ref: getSchemaPath(DeviceResponseDto) },
        },
      },
    },
  )
  @ApiError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
  @ApiError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Urinishlar tugadi, yangi kod kerak')
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
  @ApiSuccess(OtpSentResponseDto, { description: 'Yangi kod yuborildi' })
  @ApiValidationError()
  @ApiError(400, 'OTP_NOT_PENDING', 'Avval parol bilan kirish kerak')
  @ApiError(429, 'OTP_RESEND_TOO_SOON', 'Cooldown tugamagan', {
    type: 'object',
    properties: { retryAfter: { type: 'integer', example: 45 } },
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
  @ApiSuccess(ForgotPasswordResponseDto, {
    description: 'Raqam mavjud bo‘lsa kod yuborildi (javob bir xil)',
  })
  @ApiValidationError()
  @ApiError(429, 'OTP_RESEND_TOO_SOON', 'Cooldown tugamagan')
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
  @ApiSuccess(MessageResponseDto, { description: 'Parol yangilandi' })
  @ApiValidationError()
  @ApiError(400, ['OTP_INVALID', 'OTP_EXPIRED'], 'Kod xato yoki eskirgan')
  @ApiError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Urinishlar tugadi')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Access tokenni yangilash',
    description:
      'Qurilmaning `lastActiveAt` maydoni har muvaffaqiyatli refreshda yangilanadi.',
  })
  @ApiSuccess(RefreshResponseDto, { description: 'Tokenlar yangilandi' })
  @ApiError(
    401,
    ['REFRESH_TOKEN_MISSING', 'SESSION_EXPIRED', 'SESSION_REVOKED'],
    'Qaytadan kirish talab etiladi',
  )
  @ApiError(403, 'ACCOUNT_INACTIVE', 'Hisob bloklangan')
  refreshToken(
    @RefreshToken() refreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(refreshToken, res, req);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Tizimdan chiqish va qurilma sessiyasini o'chirish",
  })
  @ApiSuccess(MessageResponseDto, { description: 'Chiqildi, cookie tozalandi' })
  signOut(
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(refreshToken, res);
  }
}
