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
import {
  ProductDetailResponseDto,
  ProductListItemDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiError,
  ApiPaginatedSuccess,
  ApiSuccess,
  ApiValidationError,
  MessageResponseDto,
} from '../../common/swagger';
import 'multer';

/**
 * Mahsulot multipart body'si: DTO maydonlari + `image` fayli.
 * `multipart/form-data` da barcha qiymatlar string bo'lib keladi,
 * shuning uchun sonlar `type: string` sifatida hujjatlanadi.
 */
const PRODUCT_BODY = (required: string[]) => ({
  schema: {
    type: 'object',
    // OpenAPI'da `required` bo'sh massiv bo'la olmaydi (PATCH'da hamma maydon
    // ixtiyoriy) — bunday holatda kalit umuman qo'yilmaydi.
    ...(required.length ? { required } : {}),
    properties: {
      name: { type: 'string', example: 'Coca Cola 1L' },
      sellingPrice: { type: 'string', example: '12000', description: "So'mda" },
      categoryId: { type: 'string', example: '3' },
      unit: { type: 'string', example: 'dona' },
      barcode: { type: 'string', example: '1112223334' },
      minStock: { type: 'string', example: '5' },
      image: {
        type: 'string',
        format: 'binary',
        description: 'jpg | jpeg | png | webp | heic, 10 MB gacha',
      },
    },
  },
});

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(PRODUCT_BODY(['name', 'sellingPrice']))
  @ApiOperation({ summary: 'Mahsulot yaratish (rasm bilan)' })
  @ApiSuccess(ProductResponseDto, {
    status: 201,
    description: 'Mahsulot yaratildi',
  })
  @ApiValidationError()
  @ApiError(409, 'CONFLICT', 'Bunday shtrix-kodli mahsulot mavjud')
  @ApiAuthErrors()
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
  @ApiPaginatedSuccess(ProductListItemDto, {
    description: "Sahifalangan mahsulotlar ro'yxati",
  })
  @ApiValidationError()
  @ApiAuthErrors()
  findAll(
    @CurrentUser('storeId') storeId: number,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(storeId, query);
  }

  @Roles('ADMIN', 'SELLER')
  @Get(':id')
  @ApiOperation({ summary: 'Mahsulot tafsilotlari' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiSuccess(ProductDetailResponseDto, { description: 'Mahsulot' })
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiAuthErrors()
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
  @ApiBody(PRODUCT_BODY([]))
  @ApiOperation({ summary: 'Mahsulotni tahrirlash (rasmni yangilash bilan)' })
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiSuccess(ProductResponseDto, { description: 'Mahsulot yangilandi' })
  @ApiValidationError()
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiError(409, 'CONFLICT', 'Bunday shtrix-kodli mahsulot mavjud')
  @ApiAuthErrors()
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
  @ApiParam({ name: 'id', type: Number, example: 7 })
  @ApiSuccess(MessageResponseDto, { description: "Mahsulot o'chirildi" })
  @ApiError(404, 'NOT_FOUND', 'Mahsulot topilmadi')
  @ApiAuthErrors()
  remove(
    @CurrentUser('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.remove(storeId, id);
  }
}
