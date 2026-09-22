import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiBadRequestResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetUserPasswordDto } from './dto/reset-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  UserId,
} from '../../common/decorators/current-user.decorator';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import type { IPayload } from '../../common/interface';
import 'multer';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* --------------------- Har qanday autentifikatsiyalangan user --------------------- */

  @Get('me')
  @ApiOperation({ summary: "O'z profilini ko'rish" })
  getProfile(@UserId() userId: number) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: "O'z profilini tahrirlash" })
  updateProfile(@UserId() userId: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "Profil rasmini yuklash (eski rasm avtomatik o'chiriladi)",
  })
  updateProfileImage(
    @UserId() userId: number,
    @UploadedFile(new ImageValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(userId, image);
  }

  @Delete('me/image')
  @ApiOperation({ summary: "Profil rasmini o'chirish" })
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
  @ApiBadRequestResponse({
    description: "storeId ko'rsatilmagan yoki do'kon faol emas",
  })
  @ApiNotFoundResponse({ description: "Do'kon topilmadi" })
  create(@CurrentUser() actor: IPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(actor, dto);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Xodim ma'lumoti" })
  findOne(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.findOne(actor, id);
  }

  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Xodimni tahrirlash / bloklash (status)' })
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
    summary: "Xodim parolini tiklash (barcha sessiyalari bekor qilinadi)",
  })
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
  remove(
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(actor, id);
  }
}
