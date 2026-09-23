import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
} from '../../common/swagger';
import {
  InventoryOperationResponseDto,
  InventoryTransactionResponseDto,
  StockLevelResponseDto,
} from './dto/inventory-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Ombor kirimi (xarid)' })
  @ApiSuccess(InventoryOperationResponseDto, {
    status: 201,
    description: 'Zaxira oshirildi',
  })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiAuthErrors()
  @Roles(Role.MANAGER, Role.ADMIN)
  purchase(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.purchase(storeId, dto);
  }

  @Post('write-off')
  @ApiOperation({ summary: 'Hisobdan chiqarish' })
  @ApiSuccess(InventoryOperationResponseDto, {
    status: 201,
    description: 'Zaxira kamaytirildi',
  })
  @ApiValidationError()
  @ApiError(400, 'BAD_REQUEST', "Yetarli zaxira yo'q")
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiAuthErrors()
  @Roles(Role.MANAGER, Role.ADMIN)
  writeOff(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.writeOff(storeId, dto);
  }

  @Post('opening')
  @ApiOperation({ summary: "Boshlang'ich qoldiq kiritish" })
  @ApiSuccess(InventoryOperationResponseDto, {
    status: 201,
    description: "Boshlang'ich qoldiq kiritildi",
  })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiAuthErrors()
  @Roles(Role.MANAGER, Role.ADMIN)
  openingStock(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.openingStock(storeId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Ombor harakatlari tarixi' })
  @ApiPaginatedSuccess(InventoryTransactionResponseDto, {
    description: 'Sahifalangan ombor harakatlari',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  getTransactions(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.getTransactions(storeId, query);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Joriy qoldiqlar' })
  @ApiPaginatedSuccess(StockLevelResponseDto, {
    description: 'Mahsulotlar qoldig‘i va kam qolganlik belgisi',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  getStockLevels(
    @CurrentUser('storeId') storeId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventoryService.getStockLevels(storeId, query);
  }
}
