import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { TrimStringsPipe } from '../common/pipes/trim-strings.pipe';
import { MaxLengthPipe } from '../common/pipes/max-length.pipe';

@ApiTags('assets')
@ApiBearerAuth('JWT')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear activo' })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({ status: 201, description: 'Activo creado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(
    @Body(TrimStringsPipe) dto: CreateAssetDto,
    @Req() req: { user: { sub?: number } },
  ) {
    return this.assetsService.create(dto, req.user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar activos' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda por nombre o código',
  })
  @ApiResponse({ status: 200, description: 'Lista de activos' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.assetsService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener activo por ID' })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo encontrado' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar activo' })
  @ApiBody({ type: UpdateAssetDto })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar activo' })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.assetsService.remove(id);
  }
}
