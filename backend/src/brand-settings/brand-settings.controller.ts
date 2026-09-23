import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BrandSettingsService } from './brand-settings.service';
import { UpdateBrandSettingsDto } from './dto/update-brand-settings.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { imageFileFilter, uploadToBlob } from '../common/utils/blob-upload.util';

@ApiTags('brand-settings')
@Controller('brand-settings')
export class BrandSettingsController {
  constructor(private readonly brandSettingsService: BrandSettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener configuración de marca' })
  @ApiResponse({ status: 200, description: 'Configuración de marca' })
  async getSettings() {
    return this.brandSettingsService.getSettings();
  }

  @Patch()
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar configuración de marca (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async updateSettings(@Body() dto: UpdateBrandSettingsDto) {
    return this.brandSettingsService.updateSettings(dto);
  }

  @Post('upload')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir logo o favicon (solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Archivo subido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'logo' | 'favicon',
  ) {
    const folder = type === 'favicon' ? 'favicons' : 'logos';
    const url = await uploadToBlob(folder, file);
    return { url, type };
  }
}
