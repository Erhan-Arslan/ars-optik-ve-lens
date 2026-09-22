import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CATEGORY_SLUGS, GENDER_SLUGS, type CategorySlug, type GenderSlug } from '../../products/dto/query-products.dto.js';
import { SHAPE_SLUGS, type ShapeSlug } from '../../products/product.mapper.js';

export class ProductColorDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiProperty() @IsString() @MinLength(3) hex!: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(2) slug!: string;
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty() @IsString() @MinLength(2) brand!: string;

  @ApiProperty({ enum: CATEGORY_SLUGS }) @IsIn(CATEGORY_SLUGS) category!: CategorySlug;
  @ApiProperty({ enum: GENDER_SLUGS }) @IsIn(GENDER_SLUGS) gender!: GenderSlug;

  @ApiProperty({ enum: SHAPE_SLUGS, required: false })
  @IsOptional()
  @IsIn(SHAPE_SLUGS)
  shape?: ShapeSlug;

  @ApiProperty() @Type(() => Number) @IsNumber() @IsPositive() price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number;

  @ApiProperty() @IsString() @MinLength(10) description!: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() material?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isNew?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isBestseller?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() requiresPrescription?: boolean;

  @ApiProperty({ type: () => [ProductColorDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors!: ProductColorDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
