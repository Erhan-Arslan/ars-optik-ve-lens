import { FrameShape, Gender, ProductCategory } from '../generated/prisma/enums.js';
import type { CategorySlug, GenderSlug } from './dto/query-products.dto.js';

export const CATEGORY_TO_SLUG: Record<ProductCategory, CategorySlug> = {
  [ProductCategory.CERCEVE]: 'cerceve',
  [ProductCategory.GUNES_GOZLUGU]: 'gunes-gozlugu',
  [ProductCategory.LENS]: 'lens',
};

export const SLUG_TO_CATEGORY: Record<CategorySlug, ProductCategory> = {
  cerceve: ProductCategory.CERCEVE,
  'gunes-gozlugu': ProductCategory.GUNES_GOZLUGU,
  lens: ProductCategory.LENS,
};

export const GENDER_TO_SLUG: Record<Gender, GenderSlug> = {
  [Gender.KADIN]: 'kadin',
  [Gender.ERKEK]: 'erkek',
  [Gender.UNISEX]: 'unisex',
};

export const SLUG_TO_GENDER: Record<GenderSlug, Gender> = {
  kadin: Gender.KADIN,
  erkek: Gender.ERKEK,
  unisex: Gender.UNISEX,
};

export const SHAPE_SLUGS = ['yuvarlak', 'kare', 'kelebek', 'pilot', 'oval', 'dikdortgen'] as const;
export type ShapeSlug = (typeof SHAPE_SLUGS)[number];

const SHAPE_TO_SLUG: Record<FrameShape, ShapeSlug> = {
  [FrameShape.YUVARLAK]: 'yuvarlak',
  [FrameShape.KARE]: 'kare',
  [FrameShape.KELEBEK]: 'kelebek',
  [FrameShape.PILOT]: 'pilot',
  [FrameShape.OVAL]: 'oval',
  [FrameShape.DIKDORTGEN]: 'dikdortgen',
};

export const SLUG_TO_SHAPE: Record<ShapeSlug, FrameShape> = {
  yuvarlak: FrameShape.YUVARLAK,
  kare: FrameShape.KARE,
  kelebek: FrameShape.KELEBEK,
  pilot: FrameShape.PILOT,
  oval: FrameShape.OVAL,
  dikdortgen: FrameShape.DIKDORTGEN,
};

export function mapProductForResponse<
  T extends {
    category: ProductCategory;
    gender: Gender;
    shape: FrameShape | null;
    price: unknown;
    compareAtPrice: unknown;
  },
>(product: T) {
  return {
    ...product,
    category: CATEGORY_TO_SLUG[product.category],
    gender: GENDER_TO_SLUG[product.gender],
    shape: product.shape ? SHAPE_TO_SLUG[product.shape] : undefined,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
  };
}
