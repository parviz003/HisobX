import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Do'kon foydalanuvchilarini olish" })
  findAll(@CurrentUser('storeId') storeId: string) {
    return this.usersService.findAll(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi sotuvchi/foydalanuvchi qo‘shish' })
  create(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(storeId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Foydalanuvchini tahrirlash' })
  update(
    @CurrentUser('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(storeId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Foydalanuvchini o'chirish" })
  remove(
    @CurrentUser('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(storeId, id);
  }
}
