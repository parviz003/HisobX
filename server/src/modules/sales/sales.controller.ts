import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import {
  StoreId,
  UserId,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { IPayload } from '../../common/interface';
import { Role } from '@prisma/client';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
} from '../../common/swagger';
import {
  SaleDetailResponseDto,
  SaleListItemDto,
  SaleResponseDto,
} from './dto/sale-response.dto';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Post()
  @ApiOperation({ summary: 'Savdo yaratish (naqd yoki nasiya)' })
  @ApiSuccess(SaleResponseDto, { status: 201, description: 'Savdo yaratildi' })
  @ApiValidationError()
  @ApiError(
    400,
    'BAD_REQUEST',
    "Mahsulot yo'q, zaxira yetarli emas yoki nasiya uchun mijoz ko'rsatilmagan",
  )
  @ApiAuthErrors()
  create(
    @StoreId() storeId: number,
    @UserId() userId: number,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.create(storeId, userId, createSaleDto);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Get()
  @ApiOperation({ summary: "Savdolar ro'yxati (filtrlar bilan)" })
  @ApiPaginatedSuccess(SaleListItemDto, {
    description: 'Sahifalangan savdolar',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(
    @StoreId() storeId: number,
    @CurrentUser() actor: IPayload,
    @Query() query: QuerySaleDto,
  ) {
    return this.salesService.findAll(storeId, actor, query);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Get(':id')
  @ApiOperation({ summary: 'Savdo tafsilotlari' })
  @ApiParam({ name: 'id', type: Number, example: 9 })
  @ApiSuccess(SaleDetailResponseDto, { description: 'Savdo' })
  @ApiError(404, 'NOT_FOUND', 'Savdo topilmadi')
  @ApiAuthErrors()
  findOne(
    @StoreId() storeId: number,
    @CurrentUser() actor: IPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.salesService.findOne(storeId, actor, id);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Savdoni bekor qilish (zaxira va kassa qaytariladi)',
  })
  @ApiParam({ name: 'id', type: Number, example: 9 })
  @ApiSuccess(SaleResponseDto, { description: 'Savdo bekor qilindi' })
  @ApiError(400, 'BAD_REQUEST', 'Savdo allaqachon bekor qilingan')
  @ApiError(404, 'NOT_FOUND', 'Savdo topilmadi')
  @ApiAuthErrors()
  cancel(
    @StoreId() storeId: number,
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.salesService.cancel(storeId, id, userId);
  }
}
