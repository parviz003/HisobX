import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { CurrentUser, UserId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Expenses')
@Roles(Role.ADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Categories
  @Get('categories')
  @ApiOperation({ summary: 'Xarajat toifalarini olish' })
  findAllCategories(@CurrentUser('storeId') storeId: number) {
    return this.expensesService.findAllCategories(storeId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Yangi xarajat toifasini yaratish' })
  createCategory(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.expensesService.createCategory(storeId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Xarajat toifasini tahrirlash' })
  updateCategory(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateCategory(storeId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: "Xarajat toifasini o'chirish" })
  removeCategory(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.removeCategory(storeId, id);
  }

  // Expenses
  @Post()
  @ApiOperation({ summary: 'Xarajat qo‘shish (avtomatik kassadan chiqadi)' })
  create(
    @CurrentUser('storeId') storeId: number,
    @UserId() userId: number,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(storeId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Xarajatlar ro‘yxatini sahifalash va filtrlash' })
  findAll(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryExpenseDto,
  ) {
    return this.expensesService.findAll(storeId, query);
  }
}
