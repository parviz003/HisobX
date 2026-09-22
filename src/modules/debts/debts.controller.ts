import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import { MakePaymentDto } from './dto/make-payment.dto';
import { QueryDebtDto } from './dto/query-debt.dto';
import {
  StoreId,
  UserId,
} from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('debts')
@Roles(Role.ADMIN, Role.SELLER)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  findAll(@Query() query: QueryDebtDto, @StoreId() storeId: string) {
    return this.debtsService.findAll(query, storeId);
  }

  @Get('overdue')
  getOverdue(@StoreId() storeId: string) {
    return this.debtsService.getOverdue(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @StoreId() storeId: string) {
    return this.debtsService.findOne(id, storeId);
  }

  @Post(':id/pay')
  makePayment(
    @Param('id') id: string,
    @Body() dto: MakePaymentDto,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return this.debtsService.makePayment(id, dto, storeId, userId);
  }
}
