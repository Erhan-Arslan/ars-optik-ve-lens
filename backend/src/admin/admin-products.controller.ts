import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AdminProductsService } from './admin-products.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Tüm ürünleri listeler' })
  findAll() {
    return this.adminProductsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Yeni ürün oluşturur' })
  create(@Body() dto: CreateProductDto) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Ürünü günceller' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminProductsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Ürünü siler' })
  remove(@Param('id') id: string) {
    return this.adminProductsService.remove(id);
  }
}
