import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty() @IsString() @MinLength(2) title!: string;
  @ApiProperty() @IsString() @MinLength(3) fullName!: string;
  @ApiProperty() @IsString() @MinLength(10) phone!: string;
  @ApiProperty() @IsString() @MinLength(2) city!: string;
  @ApiProperty() @IsString() @MinLength(2) district!: string;
  @ApiProperty() @IsString() @MinLength(10) addressLine!: string;
  @ApiProperty() @IsString() @MinLength(5) zip!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
