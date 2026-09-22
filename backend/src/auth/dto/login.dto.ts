import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ayse@ornek.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email!: string;

  @ApiProperty({ example: 'guclu-sifre-123' })
  @IsString()
  password!: string;
}
