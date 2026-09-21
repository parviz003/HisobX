import { Controller, Get, Patch, Body } from '@nestjs/common';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Roles(Role.ADMIN, Role.SELLER)
  @Get('me')
  @ApiOperation({ summary: "Joriy do'kon ma'lumotlarini olish" })
  getStore(@CurrentUser('storeId') storeId: string) {
    return this.storesService.getStore(storeId);
  }

  @Roles(Role.ADMIN)
  @Patch('me')
  @ApiOperation({ summary: "Do'kon ma'lumotlarini tahrirlash" })
  updateStore(
    @CurrentUser('storeId') storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(storeId, dto);
  }
}
