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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import {
  CustomerDetailResponseDto,
  CustomerResponseDto,
} from './dto/customer-response.dto';
import { StoreId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  DeletedResponseDto,
} from '../../common/swagger';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Post()
  @ApiOperation({ summary: "Yangi mijoz qo'shish" })
  @ApiSuccess(CustomerResponseDto, {
    status: 201,
    description: "Mijoz qo'shildi",
  })
  @ApiValidationError()
  @ApiAuthErrors()
  create(
    @StoreId() storeId: number,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(storeId, createCustomerDto);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Get()
  @ApiOperation({ summary: "Mijozlar ro'yxati (qidiruv va sahifalash bilan)" })
  @ApiPaginatedSuccess(CustomerResponseDto, { description: 'Mijozlar' })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(@StoreId() storeId: number, @Query() query: QueryCustomerDto) {
    return this.customersService.findAll(storeId, query);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Get(':id')
  @ApiOperation({
    summary: 'Mijoz tafsilotlari',
    description: "To'lanmagan qarzlar va ularning jami summasi bilan",
  })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @ApiSuccess(CustomerDetailResponseDto, { description: 'Mijoz' })
  @ApiError(404, 'NOT_FOUND', 'Mijoz topilmadi')
  @ApiAuthErrors()
  findOne(@StoreId() storeId: number, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(storeId, id);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.SELLER)
  @Patch(':id')
  @ApiOperation({ summary: 'Mijozni tahrirlash' })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @ApiSuccess(CustomerResponseDto, { description: 'Mijoz yangilandi' })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Mijoz topilmadi')
  @ApiAuthErrors()
  update(
    @StoreId() storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(storeId, id, updateCustomerDto);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: "Mijozni o'chirish (qarzi/savdosi bo'lmasa)" })
  @ApiParam({ name: 'id', type: Number, example: 4 })
  @ApiSuccess(DeletedResponseDto, { description: "Mijoz o'chirildi" })
  @ApiError(400, 'BAD_REQUEST', 'Mijozda qarz yoki savdo mavjud')
  @ApiError(404, 'NOT_FOUND', 'Mijoz topilmadi')
  @ApiAuthErrors()
  remove(@StoreId() storeId: number, @Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(storeId, id);
  }
}
