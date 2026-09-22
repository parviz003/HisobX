import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import 'multer';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mahsulot yaratish (rasm bilan)' })
  create(
    @CurrentUser('storeId') storeId: number,
    @Body() createProductDto: CreateProductDto,
    @UploadedFile(new ImageValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.productsService.create(storeId, createProductDto, image);
  }

  @Roles('ADMIN', 'SELLER')
  @Get()
  @ApiOperation({ summary: 'Barcha mahsulotlarni qidirish va sahifalash' })
  findAll(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(storeId, query);
  }

  @Roles('ADMIN', 'SELLER')
  @Get(':id')
  @ApiOperation({ summary: 'Mahsulot tafsilotlari' })
  findOne(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.findOne(storeId, id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mahsulotni tahrirlash (rasmni yangilash bilan)' })
  update(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile(new ImageValidationPipe()) image?: Express.Multer.File,
  ) {
    return this.productsService.update(storeId, id, updateProductDto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: "Mahsulotni o'chirish (soft delete va rasmni tozalash)",
  })
  remove(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.remove(storeId, id);
  }
}
