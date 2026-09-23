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
import {
  CurrentUser,
  UserId,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  MessageResponseDto,
} from '../../common/swagger';
import {
  ExpenseCategoryResponseDto,
  ExpenseResponseDto,
} from './dto/expense-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Expenses')
@Roles(Role.MANAGER, Role.ADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Categories
  @Get('categories')
  @ApiOperation({ summary: 'Xarajat toifalarini olish' })
  @ApiPaginatedSuccess(ExpenseCategoryResponseDto, {
    description: 'Xarajat toifalari',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAllCategories(
    @CurrentUser('storeId') storeId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.expensesService.findAllCategories(storeId, query);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Yangi xarajat toifasini yaratish' })
  @ApiSuccess(ExpenseCategoryResponseDto, {
    status: 201,
    description: 'Toifa yaratildi',
  })
  @ApiValidationError()
  @ApiError(409, 'CONFLICT', 'Bu nomli toifa mavjud')
  @ApiAuthErrors()
  createCategory(
    @CurrentUser('storeId') storeId: number,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.expensesService.createCategory(storeId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Xarajat toifasini tahrirlash' })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @ApiSuccess(ExpenseCategoryResponseDto, { description: 'Toifa yangilandi' })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Toifa topilmadi')
  @ApiAuthErrors()
  updateCategory(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.expensesService.updateCategory(storeId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: "Xarajat toifasini o'chirish" })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @ApiSuccess(MessageResponseDto, { description: "Toifa o'chirildi" })
  @ApiError(400, 'BAD_REQUEST', "Toifaga bog'langan xarajatlar mavjud")
  @ApiError(404, 'NOT_FOUND', 'Toifa topilmadi')
  @ApiAuthErrors()
  removeCategory(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.removeCategory(storeId, id);
  }

  // Expenses
  @Post()
  @ApiOperation({ summary: 'Xarajat qo‘shish (avtomatik kassadan chiqadi)' })
  @ApiSuccess(ExpenseResponseDto, {
    status: 201,
    description: 'Xarajat yozildi va kassadan chiqarildi',
  })
  @ApiValidationError()
  @ApiError(400, 'BAD_REQUEST', "Kassada yetarli mablag' yo'q")
  @ApiError(404, 'NOT_FOUND', 'Xarajat toifasi topilmadi')
  @ApiAuthErrors()
  create(
    @CurrentUser('storeId') storeId: number,
    @UserId() userId: number,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(storeId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Xarajatlar ro‘yxatini sahifalash va filtrlash' })
  @ApiPaginatedSuccess(ExpenseResponseDto, {
    description: 'Sahifalangan xarajatlar',
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryExpenseDto,
  ) {
    return this.expensesService.findAll(storeId, query);
  }
}
