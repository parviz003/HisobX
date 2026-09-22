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
import { CategoryResponseDto } from './dto/category-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiSuccess,
  ApiValidationError,
  DeletedResponseDto,
} from '../../common/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Yangi toifa yaratish' })
  @ApiSuccess(CategoryResponseDto, {
    status: 201,
    description: 'Toifa yaratildi',
  })
  @ApiValidationError()
  @ApiError(409, 'CONFLICT', 'Bu nomli toifa allaqachon mavjud')
  @ApiAuthErrors()
  create(
    @CurrentUser('storeId') storeId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(storeId, createCategoryDto);
  }

  @Roles('ADMIN', 'SELLER')
  @Get()
  @ApiOperation({ summary: "Toifalar ro'yxati" })
  @ApiSuccess(CategoryResponseDto, { isArray: true, description: 'Toifalar' })
  @ApiAuthErrors()
  findAll(@CurrentUser('storeId') storeId: number) {
    return this.categoriesService.findAll(storeId);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Toifani tahrirlash' })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(CategoryResponseDto, { description: 'Toifa yangilandi' })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Toifa topilmadi')
  @ApiError(409, 'CONFLICT', 'Bu nomli toifa allaqachon mavjud')
  @ApiAuthErrors()
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
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiSuccess(DeletedResponseDto, { description: "Toifa o'chirildi" })
  @ApiError(404, 'NOT_FOUND', 'Toifa topilmadi')
  @ApiAuthErrors()
  remove(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(storeId, id);
  }
}
