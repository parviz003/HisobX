import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('purchase')
  @ApiOperation({ summary: "Ombor kirimi (xarid)" })
  @Roles(Role.ADMIN)
  purchase(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.purchase(storeId, dto);
  }

  @Post('write-off')
  @ApiOperation({ summary: "Hisobdan chiqarish" })
  @Roles(Role.ADMIN)
  writeOff(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.writeOff(storeId, dto);
  }

  @Post('opening')
  @ApiOperation({ summary: "Boshlang'ich qoldiq kiritish" })
  @Roles(Role.ADMIN)
  openingStock(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.openingStock(storeId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: "Ombor harakatlari tarixi" })
  @Roles(Role.ADMIN, Role.SELLER)
  getTransactions(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.getTransactions(storeId, query);
  }

  @Get('stock')
  @ApiOperation({ summary: "Joriy qoldiqlar" })
  @Roles(Role.ADMIN, Role.SELLER)
  getStockLevels(@CurrentUser('storeId') storeId: number) {
    return this.inventoryService.getStockLevels(storeId);
  }
}
