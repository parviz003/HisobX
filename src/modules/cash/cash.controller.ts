import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { QueryCashTransactionDto } from './dto/query-cash-transaction.dto';
import { CurrentUser, UserId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Cash')
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Get('balance')
  @ApiOperation({ summary: "Joriy kassa balansini ko'rish" })
  getBalance(@CurrentUser('storeId') storeId: string) {
    return this.cashService.getBalance(storeId);
  }

  @Roles(Role.ADMIN)
  @Post('transaction')
  @ApiOperation({ summary: 'Kassaga pul kiritish / chiqarish (Opening, Adjustment, Expense)' })
  create(
    @CurrentUser('storeId') storeId: string,
    @UserId() userId: string,
    @Body() dto: CreateCashTransactionDto,
  ) {
    return this.cashService.create(storeId, userId, dto);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Get('transactions')
  @ApiOperation({ summary: 'Kassa operatsiyalari tarixini sahifalash va filtrlash' })
  findAll(
    @CurrentUser('storeId') storeId: string,
    @Query() query: QueryCashTransactionDto,
  ) {
    return this.cashService.findAll(storeId, query);
  }
}
