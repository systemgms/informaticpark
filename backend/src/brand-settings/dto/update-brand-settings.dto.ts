import { IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateBrandSettingsDto {
  @IsString()
  @IsOptional()
  appName?: string;

  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @IsHexColor()
  @IsOptional()
  secondaryColor?: string;

  @IsHexColor()
  @IsOptional()
  accentColor?: string;

  @IsUrl({}, { message: 'logoUrl debe ser una URL válida' })
  @IsOptional()
  logoUrl?: string;

  @IsUrl({}, { message: 'faviconUrl debe ser una URL válida' })
  @IsOptional()
  faviconUrl?: string;
}
