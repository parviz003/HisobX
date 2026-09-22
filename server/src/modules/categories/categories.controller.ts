import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: "Yangi toifa yaratish" })
  create(
    @CurrentUser('storeId') storeId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(storeId, createCategoryDto);
  }

  @Roles('ADMIN', 'SELLER')
  @Get()
  @ApiOperation({ summary: "Toifalar ro'yxati" })
  findAll(@CurrentUser('storeId') storeId: number) {
    return this.categoriesService.findAll(storeId);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: "Toifani tahrirlash" })
  update(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(storeId, id, updateCategoryDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: "Toifani o'chirish" })
  remove(@CurrentUser('storeId') storeId: number, @Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(storeId, id);
  }
}
