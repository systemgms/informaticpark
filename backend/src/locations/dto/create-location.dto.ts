import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLocationDto {
  @ApiPropertyOptional({ example: 'Quito' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  canton?: string;

  @ApiPropertyOptional({ example: 'Iñaquito' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  parroquia?: string;

  @ApiPropertyOptional({ example: -0.180653 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -78.467834 })
  @IsOptional()
  @IsNumber()
  lng?: number;
}
