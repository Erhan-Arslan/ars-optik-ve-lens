import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

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

  @ApiProperty({ required: false }) @IsOptional() @IsString() prescriptionOdSphere?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() prescriptionOsSphere?: string;

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
