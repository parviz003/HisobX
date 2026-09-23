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
import { Roles } from '../../common/decorators/roles.decorator';
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
  DebtDetailResponseDto,
  DebtListItemDto,
  DebtResponseDto,
  OverdueDebtGroupDto,
} from './dto/debt-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Debts')
@Controller('debts')
@Roles(Role.ADMIN, Role.SELLER)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  @ApiOperation({ summary: "Qarzlar ro'yxati" })
  @ApiPaginatedSuccess(DebtListItemDto, { description: 'Sahifalangan qarzlar' })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(@Query() query: QueryDebtDto, @StoreId() storeId: number) {
    return this.debtsService.findAll(query, storeId);
  }

  @Get('overdue')
  @ApiOperation({
    summary: "Muddati o'tgan qarzlar",
    description: "Mijoz bo'yicha guruhlangan",
  })
  @ApiPaginatedSuccess(OverdueDebtGroupDto, {
    description: "Muddati o'tgan qarzlar",
  })
  @ApiValidationError()
  @ApiAuthErrors()
  getOverdue(@StoreId() storeId: number, @Query() query: PaginationQueryDto) {
    return this.debtsService.getOverdue(storeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Qarz tafsilotlari va to'lovlar tarixi" })
  @ApiParam({ name: 'id', type: Number, example: 11 })
  @ApiSuccess(DebtDetailResponseDto, { description: 'Qarz' })
  @ApiError(404, 'NOT_FOUND', 'Qarz topilmadi')
  @ApiAuthErrors()
  findOne(@Param('id', ParseIntPipe) id: number, @StoreId() storeId: number) {
    return this.debtsService.findOne(id, storeId);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: "Qarzga to'lov qabul qilish" })
  @ApiParam({ name: 'id', type: Number, example: 11 })
  @ApiSuccess(DebtResponseDto, { description: "To'lov qabul qilindi" })
  @ApiValidationError()
  @ApiError(
    400,
    'BAD_REQUEST',
    "To'lov summasi qoldiqdan katta yoki qarz yopilgan",
  )
  @ApiError(404, 'NOT_FOUND', 'Qarz topilmadi')
  @ApiAuthErrors()
  makePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MakePaymentDto,
    @StoreId() storeId: number,
    @UserId() userId: number,
  ) {
    return this.debtsService.makePayment(id, dto, storeId, userId);
  }
}
