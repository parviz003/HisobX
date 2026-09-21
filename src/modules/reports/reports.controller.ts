import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reports')
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Kunlik hisobot (Savdo, Foyda, Xarajat, Kassa, Qarzlar)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-21' })
  getDaily(
    @CurrentUser('storeId') storeId: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getDailyReport(storeId, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Oylik hisobot (Savdo, Tannarx, Foyda, Xarajat)' })
  @ApiQuery({ name: 'year', required: false, example: 2026 })
  @ApiQuery({ name: 'month', required: false, example: 9 })
  getMonthly(
    @CurrentUser('storeId') storeId: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.reportsService.getMonthlyReport(storeId, year, month);
  }
}
