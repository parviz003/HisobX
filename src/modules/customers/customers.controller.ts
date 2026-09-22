import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { StoreId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  create(
    @StoreId() storeId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(storeId, createCustomerDto);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Get()
  findAll(@StoreId() storeId: string, @Query('search') search?: string) {
    return this.customersService.findAll(storeId, search);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Get(':id')
  findOne(@StoreId() storeId: string, @Param('id') id: string) {
    return this.customersService.findOne(storeId, id);
  }

  @Roles(Role.ADMIN, Role.SELLER)
  @Patch(':id')
  update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(storeId, id, updateCustomerDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@StoreId() storeId: string, @Param('id') id: string) {
    return this.customersService.remove(storeId, id);
  }
}
