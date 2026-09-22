import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ayse@ornek.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email!: string;

  @ApiProperty({ example: 'guclu-sifre-123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  password!: string;

  @ApiProperty({ example: 'Ayşe' })
  @IsString()
  @MinLength(2, { message: 'Ad en az 2 karakter olmalı' })
  firstName!: string;

  @ApiProperty({ example: 'Yılmaz' })
  @IsString()
  @MinLength(2, { message: 'Soyad en az 2 karakter olmalı' })
  lastName!: string;
}
