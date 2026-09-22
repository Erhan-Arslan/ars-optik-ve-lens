import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapProductForResponse, SLUG_TO_CATEGORY, SLUG_TO_GENDER, SLUG_TO_SHAPE } from '../products/product.mapper.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: { colors: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(mapProductForResponse);
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        brand: dto.brand,
        category: SLUG_TO_CATEGORY[dto.category],
        gender: SLUG_TO_GENDER[dto.gender],
        shape: dto.shape ? SLUG_TO_SHAPE[dto.shape] : undefined,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        description: dto.description,
        material: dto.material,
        isNew: dto.isNew ?? false,
        isBestseller: dto.isBestseller ?? false,
        requiresPrescription: dto.requiresPrescription ?? false,
        colors: { create: dto.colors },
      },
      include: { colors: true },
    });
    return mapProductForResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name,
        brand: dto.brand,
        category: dto.category ? SLUG_TO_CATEGORY[dto.category] : undefined,
        gender: dto.gender ? SLUG_TO_GENDER[dto.gender] : undefined,
        shape: dto.shape ? SLUG_TO_SHAPE[dto.shape] : undefined,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        description: dto.description,
        material: dto.material,
        isNew: dto.isNew,
        isBestseller: dto.isBestseller,
        requiresPrescription: dto.requiresPrescription,
        colors: dto.colors ? { deleteMany: {}, create: dto.colors } : undefined,
      },
      include: { colors: true },
    });
    return mapProductForResponse(product);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch {
      throw new ConflictException(
        'Bu ürün geçmiş siparişlerde kullanıldığı için silinemiyor. Bunun yerine pasife alabilirsiniz.',
      );
    }
    return { success: true };
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    return product;
  }
}
