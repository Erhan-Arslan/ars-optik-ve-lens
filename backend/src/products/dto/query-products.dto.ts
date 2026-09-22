import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export const CATEGORY_SLUGS = ['cerceve', 'gunes-gozlugu', 'lens'] as const;
export const GENDER_SLUGS = ['kadin', 'erkek', 'unisex'] as const;
export const SORT_OPTIONS = ['onerilen', 'artan-fiyat', 'azalan-fiyat', 'yeni'] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type GenderSlug = (typeof GENDER_SLUGS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export class QueryProductsDto {
  @ApiPropertyOptional({ enum: CATEGORY_SLUGS })
  @IsOptional()
  @IsIn(CATEGORY_SLUGS)
  category?: CategorySlug;

  @ApiPropertyOptional({ enum: GENDER_SLUGS })
  @IsOptional()
  @IsIn(GENDER_SLUGS)
  gender?: GenderSlug;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: SORT_OPTIONS })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: SortOption;

  @ApiPropertyOptional({ description: 'Ürün adı veya markasında arama yapar' })
  @IsOptional()
  @IsString()
  search?: string;
}
