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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { OnboardStoreDto } from './dto/onboard-store.dto';
import { TransferManagerDto } from './dto/transfer-manager.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  DeletedResponseDto,
} from '../../common/swagger';
import {
  OnboardStoreResponseDto,
  TransferManagerResponseDto,
  StoreListItemResponseDto,
  StoreResponseDto,
} from './dto/store-response.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Get('me')
  @ApiOperation({ summary: "Joriy do'kon ma'lumotlarini olish" })
  @ApiSuccess(StoreResponseDto, { description: "Do'kon ma'lumotlari" })
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiAuthErrors()
  getStore(@CurrentUser('storeId') storeId: number) {
    return this.storesService.getStore(storeId);
  }

  @Roles(Role.MANAGER)
  @Patch('me')
  @ApiOperation({ summary: "Do'kon ma'lumotlarini tahrirlash" })
  @ApiSuccess(StoreResponseDto, { description: "Do'kon yangilandi" })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiAuthErrors()
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
  @ApiPaginatedSuccess(StoreListItemResponseDto, {
    description: "Do'konlar ro'yxati (xodim/mahsulot/savdo soni bilan)",
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(@Query() query: QueryStoreDto) {
    return this.storesService.findAll(query);
  }

  @Roles(Role.SUPERADMIN)
  @Post()
  @ApiOperation({ summary: "Yangi do'kon ochish (faqat SUPERADMIN)" })
  @ApiSuccess(StoreResponseDto, {
    status: 201,
    description: "Do'kon yaratildi",
  })
  @ApiValidationError()
  @ApiAuthErrors()
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
  @ApiSuccess(OnboardStoreResponseDto, {
    status: 201,
    description: "Yaratilgan do'kon va uning rahbari (maxfiy maydonlarsiz)",
  })
  @ApiValidationError()
  @ApiError(409, 'PHONE_TAKEN', 'Telefon raqami band')
  @ApiAuthErrors()
  onboard(@Body() dto: OnboardStoreDto) {
    return this.storesService.onboard(dto);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id/manager')
  @ApiOperation({
    summary: "Menejerlikni boshqa xodimga o'tkazish (faqat SUPERADMIN)",
    description:
      "Yangi meneger MANAGER bo'ladi, eskisi ADMIN — bitta tranzaksiyada. " +
      "Foydalanuvchi shu do'konning xodimi bo'lishi shart.",
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiSuccess(TransferManagerResponseDto, { description: 'Yangi meneger' })
  @ApiValidationError()
  @ApiError(404, 'USER_NOT_FOUND', "Bu do'konda bunday xodim yo'q")
  @ApiError(409, 'MANAGER_ALREADY_EXISTS', 'Bu xodim allaqachon meneger')
  @ApiAuthErrors()
  transferManager(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferManagerDto,
  ) {
    return this.storesService.transferManager(id, dto.userId);
  }

  @Roles(Role.SUPERADMIN)
  @Get(':id')
  @ApiOperation({ summary: "Do'kon ma'lumoti (faqat SUPERADMIN)" })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiSuccess(StoreResponseDto, { description: "Do'kon" })
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiAuthErrors()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.getStore(id);
  }

  @Roles(Role.SUPERADMIN)
  @Patch(':id')
  @ApiOperation({ summary: "Do'konni tahrirlash (faqat SUPERADMIN)" })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiSuccess(StoreResponseDto, { description: "Do'kon yangilandi" })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiAuthErrors()
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(id, dto);
  }

  @Roles(Role.SUPERADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Do'konni o'chirish (faqat SUPERADMIN)" })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiSuccess(DeletedResponseDto, { description: "Do'kon o'chirildi" })
  @ApiError(404, 'NOT_FOUND', "Do'kon topilmadi")
  @ApiAuthErrors()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.remove(id);
  }
}
