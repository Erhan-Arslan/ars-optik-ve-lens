import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapProductForResponse, SLUG_TO_CATEGORY, SLUG_TO_GENDER } from './product.mapper.js';
import type { QueryProductsDto } from './dto/query-products.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = SLUG_TO_CATEGORY[query.category];
    }
    if (query.gender) {
      where.gender = SLUG_TO_GENDER[query.gender];
    }
    if (query.maxPrice) {
      where.price = { lte: query.maxPrice };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case 'artan-fiyat':
          return [{ price: 'asc' }];
        case 'azalan-fiyat':
          return [{ price: 'desc' }];
        case 'yeni':
          return [{ isNew: 'desc' }, { createdAt: 'desc' }];
        default:
          return [{ isBestseller: 'desc' }, { createdAt: 'desc' }];
      }
    })();

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: { colors: true },
    });

    return products.map(mapProductForResponse);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { colors: true },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return mapProductForResponse(product);
  }

  async getLensOptions() {
    const [lensTypes, lensCoatings] = await Promise.all([
      this.prisma.lensType.findMany(),
      this.prisma.lensCoating.findMany(),
    ]);

    return {
      lensTypes: lensTypes.map((lt) => ({ ...lt, priceModifier: Number(lt.priceModifier) })),
      lensCoatings: lensCoatings.map((lc) => ({ ...lc, priceModifier: Number(lc.priceModifier) })),
    };
  }
}
