import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBulkMovementDto {
  @ApiProperty({
    description: 'IDs de los activos a traspasar',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  assetIds!: number[];

  @ApiPropertyOptional({ description: 'ID del custodio destino' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  toCustodianId?: number;

  @ApiPropertyOptional({ description: 'ID de la ubicación destino' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  toLocationId?: number;

  @ApiPropertyOptional({ description: 'Observaciones del traspaso' })
  @IsString()
  @IsOptional()
  note?: string;
}
