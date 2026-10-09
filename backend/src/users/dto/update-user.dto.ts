import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_PATTERN,
  PASSWORD_PATTERN_MESSAGE,
} from '../password-policy';
import { Transform, Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_PATTERN_MESSAGE })
  password?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'USER'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'USER'])
  role?: 'ADMIN' | 'USER';

  @ApiPropertyOptional({
    description: 'ID del custodio vinculado (null para desvincular)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  custodianId?: number | null;

  @ApiPropertyOptional({ description: 'Indica si el usuario está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
