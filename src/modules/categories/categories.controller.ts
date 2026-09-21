import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles('ADMIN')
  @Post()
  create(
    @CurrentUser('storeId') storeId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(storeId, createCategoryDto);
  }

  @Roles('ADMIN', 'SELLER')
  @Get()
  findAll(@CurrentUser('storeId') storeId: string) {
    return this.categoriesService.findAll(storeId);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @CurrentUser('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(storeId, id, updateCategoryDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@CurrentUser('storeId') storeId: string, @Param('id') id: string) {
    return this.categoriesService.remove(storeId, id);
  }
}
