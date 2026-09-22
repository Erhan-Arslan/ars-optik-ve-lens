import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ProductsService } from './products.service.js';
import { QueryProductsDto } from './dto/query-products.dto.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Filtrelenebilir ürün kataloğunu listeler' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('meta/lens-options')
  @ApiOperation({ summary: 'Lens tipi ve kaplama seçeneklerini döner' })
  getLensOptions() {
    return this.productsService.getLensOptions();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Slug ile tekil ürün detayını döner' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
