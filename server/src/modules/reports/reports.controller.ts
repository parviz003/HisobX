import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiSuccess,
  ApiValidationError,
} from '../../common/swagger';
import {
  DailyReportResponseDto,
  MonthlyReportResponseDto,
} from './dto/report-response.dto';

@ApiTags('Reports')
@Roles(Role.MANAGER, Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({
    summary: 'Kunlik hisobot (Savdo, Foyda, Xarajat, Kassa, Qarzlar)',
  })
  @ApiQuery({ name: 'date', required: false, example: '2026-09-21' })
  @ApiSuccess(DailyReportResponseDto, { description: 'Kunlik hisobot' })
  @ApiValidationError()
  @ApiAuthErrors()
  getDaily(
    @CurrentUser('storeId') storeId: number,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getDailyReport(storeId, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Oylik hisobot (Savdo, Tannarx, Foyda, Xarajat)' })
  @ApiQuery({ name: 'year', required: false, example: 2026 })
  @ApiQuery({ name: 'month', required: false, example: 9 })
  @ApiSuccess(MonthlyReportResponseDto, { description: 'Oylik hisobot' })
  @ApiValidationError()
  @ApiAuthErrors()
  getMonthly(
    @CurrentUser('storeId') storeId: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
  ) {
    return this.reportsService.getMonthlyReport(storeId, year, month);
  }
}
