import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetUserPasswordDto } from './dto/reset-password.dto';
import {
  ChangePasswordResponseDto,
  UserPasswordResetResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  UserId,
} from '../../common/decorators/current-user.decorator';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import type { IPayload } from '../../common/interface';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  DeletedResponseDto,
} from '../../common/swagger';
import 'multer';

/** Rasm yuklash uchun multipart body sxemasi */
const IMAGE_BODY = {
  schema: {
    type: 'object',
    required: ['image'],
    properties: {
      image: {
        type: 'string',
        format: 'binary',
        description: 'jpg | jpeg | png | webp | heic, 10 MB gacha',
      },
    },
  },
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* --------------------- Har qanday autentifikatsiyalangan user --------------------- */

  @Get('me')
  @ApiOperation({ summary: "O'z profilini ko'rish" })
  @ApiSuccess(UserProfileResponseDto, { description: 'Profil va do‘kon' })
  @ApiAuthErrors()
  getProfile(@UserId() userId: number) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: "O'z profilini tahrirlash",
    description:
      "Faqat `fullName` o'zgartiriladi. Telefon raqam — kirish identifikatori," +
      " shuning uchun bu yerdan o'zgartirilmaydi. Parol uchun" +
      ' `PATCH /users/me/password` ishlatiladi.',
  })
  @ApiSuccess(UserResponseDto, { description: 'Yangilangan profil' })
  @ApiValidationError()
  @ApiAuthErrors()
  updateProfile(@UserId() userId: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parolni almashtirish',
    description:
      'Joriy parol tasdiqlangach, JORIY QURILMADAN TASHQARI barcha sessiyalar' +
      " bekor qilinadi. Joriy qurilma cookie'lari amal qilishda davom etadi.",
  })
  @ApiSuccess(ChangePasswordResponseDto, { description: 'Parol yangilandi' })
  @ApiValidationError()
  @ApiError(400, 'WRONG_PASSWORD', "Joriy parol noto'g'ri")
  @ApiAuthErrors()
  changePassword(
    @CurrentUser() actor: IPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(actor.sub, actor.deviceId, dto);
  }

  @Patch('me/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(IMAGE_BODY)
  @ApiOperation({
    summary: "Profil rasmini yuklash (eski rasm avtomatik o'chiriladi)",
  })
  @ApiSuccess(UserResponseDto, { description: 'Rasm yangilandi' })
  @ApiError(400, 'BAD_REQUEST', 'Rasm yuborilmadi yoki fayl turi xato')
  @ApiAuthErrors()
  updateProfileImage(
    @UserId() userId: number,
    @UploadedFile(new ImageValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(userId, image);
  }

  @Delete('me/image')
  @ApiOperation({ summary: "Profil rasmini o'chirish" })
  @ApiSuccess(UserResponseDto, { description: "Rasm o'chirildi" })
  @ApiError(400, 'BAD_REQUEST', 'Profil rasmi mavjud emas')
  @ApiAuthErrors()
  removeProfileImage(@UserId() userId: number) {
    return this.usersService.removeProfileImage(userId);
  }

  /* ----------------------------- XODIMLAR BOSHQARUVI ----------------------------- */

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Get()
  @ApiOperation({
    summary:
      "Xodimlar ro'yxati (ADMIN — faqat o'z do'koni SELLER'lari, SUPERADMIN — barchasi)",
  })
  @ApiPaginatedSuccess(UserResponseDto, { description: "Xodimlar ro'yxati" })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(@CurrentUser() actor: IPayload, @Query() query: QueryUserDto) {
    return this.usersService.findAll(actor, query);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary:
      "Xodim yaratish (ADMIN — o'z do'koniga SELLER, SUPERADMIN — ADMIN/SELLER)",
    description:
      "SUPERADMIN uchun `storeId` majburiy va mavjud, faol do'konga tegishli bo'lishi kerak." +
      " ADMIN uchun `storeId` e'tiborsiz qoldiriladi — xodim o'z do'koniga qo'shiladi." +
      " Yangi do'kon bilan birga ADMIN yaratish uchun `POST /stores/onboard` ishlatiladi.",
  })
  @ApiSuccess(UserResponseDto, { status: 201, description: 'Xodim yaratildi' })
  @ApiValidationError()
  @ApiError(
    400,
    'VALIDATION_ERROR',
    "storeId ko'rsatilmagan yoki do'kon faol emas",
  )
  @ApiError(403, 'FORBIDDEN', 'Bu rolni yaratishga ruxsat yo‘q')
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiError(409, 'PHONE_TAKEN', 'Telefon raqami band')
  create(@CurrentUser() actor: IPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(actor, dto);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Xodim ma'lumoti" })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(UserProfileResponseDto, { description: 'Xodim' })
  @ApiError(404, 'NOT_FOUND', 'Foydalanuvchi topilmadi')
  @ApiAuthErrors()
  findOne(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.findOne(actor, id);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Xodimni tahrirlash / bloklash (status)' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(UserResponseDto, { description: 'Yangilangan xodim' })
  @ApiValidationError()
  @ApiError(403, 'FORBIDDEN', 'Ruxsat yetarli emas')
  @ApiError(404, 'NOT_FOUND', 'Foydalanuvchi topilmadi')
  @ApiError(409, 'PHONE_TAKEN', 'Telefon raqami band')
  update(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(actor, id, dto);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Patch(':id/password')
  @ApiOperation({
    summary: 'Xodim parolini tiklash (barcha sessiyalari bekor qilinadi)',
  })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(UserPasswordResetResponseDto, { description: 'Parol tiklandi' })
  @ApiValidationError()
  @ApiError(403, 'FORBIDDEN', 'Ruxsat yetarli emas')
  @ApiError(404, 'NOT_FOUND', 'Foydalanuvchi topilmadi')
  resetPassword(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.usersService.resetPassword(actor, id, dto.password);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Foydalanuvchini o'chirish (faqat SUPERADMIN)" })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(DeletedResponseDto, { description: "Foydalanuvchi o'chirildi" })
  @ApiError(403, 'FORBIDDEN', 'Ruxsat yetarli emas')
  @ApiError(404, 'NOT_FOUND', 'Foydalanuvchi topilmadi')
  remove(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(actor, id);
  }
}
