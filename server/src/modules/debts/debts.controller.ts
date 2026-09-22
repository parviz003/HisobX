import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Debts')
@Controller('debts')
@Roles(Role.ADMIN, Role.SELLER)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  @ApiOperation({ summary: "Qarzlar ro'yxati" })
  findAll(@Query() query: QueryDebtDto, @StoreId() storeId: number) {
    return this.debtsService.findAll(query, storeId);
  }

  @Get('overdue')
  @ApiOperation({ summary: "Muddati o'tgan qarzlar" })
  getOverdue(@StoreId() storeId: number) {
    return this.debtsService.getOverdue(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Qarz tafsilotlari va to'lovlar tarixi" })
  findOne(@Param('id', ParseIntPipe) id: number, @StoreId() storeId: number) {
    return this.debtsService.findOne(id, storeId);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: "Qarzga to'lov qabul qilish" })
  makePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MakePaymentDto,
    @StoreId() storeId: number,
    @UserId() userId: number,
  ) {
    return this.debtsService.makePayment(id, dto, storeId, userId);
  }
}
