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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('debts')
@Roles(Role.ADMIN, Role.SELLER)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  findAll(@Query() query: QueryDebtDto, @CurrentUser() user: JwtPayload) {
    return this.debtsService.findAll(query, user.storeId);
  }

  @Get('overdue')
  getOverdue(@CurrentUser() user: JwtPayload) {
    return this.debtsService.getOverdue(user.storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.debtsService.findOne(id, user.storeId);
  }

  @Post(':id/pay')
  makePayment(
    @Param('id') id: string,
    @Body() dto: MakePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.debtsService.makePayment(id, dto, user);
  }
}
