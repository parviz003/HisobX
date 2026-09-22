import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { OnboardStoreDto } from './dto/onboard-store.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Get('me')
  @ApiOperation({ summary: "Joriy do'kon ma'lumotlarini olish" })
  getStore(@CurrentUser('storeId') storeId: number) {
    return this.storesService.getStore(storeId);
  }

  @Roles(Role.ADMIN)
  @Patch('me')
  @ApiOperation({ summary: "Do'kon ma'lumotlarini tahrirlash" })
  updateStore(
    @CurrentUser('storeId') storeId: number,
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
  @Post('onboard')
  @ApiOperation({
    summary:
      "Do'kon va uning ADMIN'ini bitta tranzaksiyada yaratish (faqat SUPERADMIN)",
    description:
      "Do'kon hamda ADMIN rolidagi foydalanuvchi bir vaqtda yaratiladi." +
      " Admin telefoni band bo'lsa 409 qaytadi va do'kon ham yaratilmaydi.",
  })
  @ApiCreatedResponse({
    description: "Yaratilgan do'kon va admin (maxfiy maydonlarsiz)",
    schema: {
      example: {
        statusCode: 201,
        data: {
          store: {
            id: 1,
            name: 'Mening Do‘konim',
            phone: '+998901234567',
            address: 'Toshkent, Chilonzor 5',
            telegramChatId: null,
            isActive: true,
          },
          admin: {
            id: 2,
            fullName: 'Alisher Valiyev',
            phone: '+998901234567',
            role: Role.ADMIN,
            status: 'ACTIVE',
            isActive: true,
            storeId: 1,
          },
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'Bu telefon raqami band' })
  onboard(@Body() dto: OnboardStoreDto) {
    return this.storesService.onboard(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Do'kon ma'lumoti (faqat SUPERADMIN)" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.getStore(id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: "Do'konni tahrirlash (faqat SUPERADMIN)" })
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Do'konni o'chirish (faqat SUPERADMIN)" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.remove(id);
  }
}
