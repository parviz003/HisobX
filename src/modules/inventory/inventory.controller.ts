import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('purchase')
  @Roles(Role.ADMIN)
  purchase(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.purchase(storeId, dto);
  }

  @Post('write-off')
  @Roles(Role.ADMIN)
  writeOff(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.writeOff(storeId, dto);
  }

  @Post('opening')
  @Roles(Role.ADMIN)
  openingStock(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.openingStock(storeId, dto);
  }

  @Get('transactions')
  @Roles(Role.ADMIN, Role.SELLER)
  getTransactions(
    @CurrentUser('storeId') storeId: string,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.getTransactions(storeId, query);
  }

  @Get('stock')
  @Roles(Role.ADMIN, Role.SELLER)
  getStockLevels(@CurrentUser('storeId') storeId: string) {
    return this.inventoryService.getStockLevels(storeId);
  }
}
