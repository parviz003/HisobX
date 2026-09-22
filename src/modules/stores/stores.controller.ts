import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Get('me')
  @ApiOperation({ summary: "Joriy do'kon ma'lumotlarini olish" })
  getStore(@CurrentUser('storeId') storeId: string) {
    return this.storesService.getStore(storeId);
  }

  @Roles(Role.ADMIN)
  @Patch('me')
  @ApiOperation({ summary: "Do'kon ma'lumotlarini tahrirlash" })
  updateStore(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(storeId, dto);
  }

  /* ------------------------------- SUPERADMIN ------------------------------- */

  @Roles(Role.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: "Barcha do'konlar (faqat SUPERADMIN)" })
  findAll() {
    return this.storesService.findAll();
  }

  @Roles(Role.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: "Yangi do'kon ochish (faqat SUPERADMIN)" })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Do'kon ma'lumoti (faqat SUPERADMIN)" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.getStore(id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: "Do'konni tahrirlash (faqat SUPERADMIN)" })
  updateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Do'konni o'chirish (faqat SUPERADMIN)" })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.remove(id);
  }
}
