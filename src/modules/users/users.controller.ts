import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserId } from '../../common/decorators/current-user.decorator';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import 'multer';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* --------------------- Har qanday autentifikatsiyalangan user --------------------- */

  @Get('me')
  @ApiOperation({ summary: "O'z profilini ko'rish" })
  getProfile(@UserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: "O'z profilini tahrirlash" })
  updateProfile(@UserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "Profil rasmini yuklash (eski rasm avtomatik o'chiriladi)",
  })
  updateProfileImage(
    @UserId() userId: string,
    @UploadedFile(new ImageValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(userId, image);
  }

  @Delete('me/image')
  @ApiOperation({ summary: "Profil rasmini o'chirish" })
  removeProfileImage(@UserId() userId: string) {
    return this.usersService.removeProfileImage(userId);
  }

  /* ------------------------------- SUPERADMIN ------------------------------- */

  @Roles(Role.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'Barcha foydalanuvchilar (faqat SUPERADMIN)' })
  findAll(@Query('storeId') storeId?: string, @Query('role') role?: Role) {
    return this.usersService.findAll(storeId, role);
  }

  @Roles(Role.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: 'Admin/sotuvchi yaratish (faqat SUPERADMIN)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Foydalanuvchi ma'lumoti (faqat SUPERADMIN)" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Foydalanuvchini tahrirlash (faqat SUPERADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Foydalanuvchini o'chirish (faqat SUPERADMIN)" })
  remove(@Param('id', ParseUUIDPipe) id: string, @UserId() currentUserId: string) {
    return this.usersService.remove(id, currentUserId);
  }
}
