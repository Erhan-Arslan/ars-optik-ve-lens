import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsStepOf } from '../../common/decorators/is-step-of.decorator.js';

/** -20.00 … +20.00 in 0.25 D steps, as written on a prescription ("-1.25", "+0.75", "0.00"). */
const SPHERE_PATTERN = /^(?:[+-]?(?:1?\d\.(?:00|25|50|75)|20\.00))$/;

// Older clients send "" for an untouched sphere field; treat it as not provided.
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class OrderAddressDto {
  @ApiProperty() @IsString() @MinLength(3) fullName!: string;
  @ApiProperty() @IsString() @MinLength(10) phone!: string;
  @ApiProperty() @IsString() @MinLength(2) city!: string;
  @ApiProperty() @IsString() @MinLength(2) district!: string;
  @ApiProperty() @IsString() @MinLength(10) addressLine!: string;
  @ApiProperty() @IsString() @MinLength(5) zip!: string;
}

export class OrderCardDto {
  @ApiProperty() @IsString() @MinLength(3) cardName!: string;
  @ApiProperty() @IsString() @MinLength(16) cardNumber!: string;
  @ApiProperty() @IsString() cardExpiry!: string;
  @ApiProperty() @IsString() @MinLength(3) cardCvc!: string;
}

export class CreateOrderItemDto {
  @ApiProperty() @IsString() productId!: string;

  @ApiProperty() @IsInt() @Min(1) quantity!: number;

  @ApiProperty() @IsString() selectedColor!: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() lensTypeId?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() lensCoatingId?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() lensIndexId?: string;

  @ApiProperty({ required: false, example: '-1.25' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @Matches(SPHERE_PATTERN, { message: 'Sağ göz sferik değeri geçersiz (ör. -1.25)' })
  prescriptionOdSphere?: string;

  @ApiProperty({ required: false, example: '-1.50' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @Matches(SPHERE_PATTERN, { message: 'Sol göz sferik değeri geçersiz (ör. -1.50)' })
  prescriptionOsSphere?: string;

  @ApiProperty({ required: false, minimum: -6, maximum: 6 })
  @IsOptional() @IsNumber() @Min(-6) @Max(6) @IsStepOf(0.25)
  prescriptionOdCylinder?: number;

  @ApiProperty({ required: false, minimum: -6, maximum: 6 })
  @IsOptional() @IsNumber() @Min(-6) @Max(6) @IsStepOf(0.25)
  prescriptionOsCylinder?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 180 })
  @IsOptional() @IsInt() @Min(1) @Max(180)
  prescriptionOdAxis?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 180 })
  @IsOptional() @IsInt() @Min(1) @Max(180)
  prescriptionOsAxis?: number;

  @ApiProperty({ required: false, minimum: 50, maximum: 80, description: 'Göz bebekleri arası mesafe (mm)' })
  @IsOptional() @IsNumber() @Min(50) @Max(80) @IsStepOf(0.5)
  prescriptionPupillaryDistance?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString() prescriptionNotes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: () => OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  address!: OrderAddressDto;

  @ApiProperty({ type: () => OrderCardDto })
  @ValidateNested()
  @Type(() => OrderCardDto)
  card!: OrderCardDto;

  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export const ORDER_STATUS_SLUGS = ['hazirlaniyor', 'kargoda', 'teslim-edildi', 'iptal'] as const;
