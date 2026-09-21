import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.create(user.storeId, user.userId, createSaleDto);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QuerySaleDto) {
    return this.salesService.findAll(user.storeId, query);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.salesService.findOne(user.storeId, id);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.salesService.cancel(user.storeId, id, user.userId);
  }
}
