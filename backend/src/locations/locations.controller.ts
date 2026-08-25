import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { LocationsService } from './locations.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { TrimStringsPipe } from '../common/pipes/trim-strings.pipe';
import { MaxLengthPipe } from '../common/pipes/max-length.pipe';

@ApiTags('locations')
@ApiBearerAuth('JWT')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear ubicación (solo ADMIN)' })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación creada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  async create(@Body(TrimStringsPipe) dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar ubicaciones' })
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
    description: 'Búsqueda por cantón o parroquia',
  })
  @ApiQuery({
    name: 'all',
    required: false,
    type: Boolean,
    description: 'Retornar todas las ubicaciones sin paginación',
  })
  @ApiResponse({ status: 200, description: 'Lista de ubicaciones' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
    @Query('all') all?: string,
  ) {
    if (all === 'true') {
      return this.locationsService.findAllWithoutPagination();
    }
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.locationsService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la ubicación' })
  @ApiResponse({ status: 200, description: 'Ubicación encontrada' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada' })
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar ubicación (solo ADMIN)' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiParam({ name: 'id', description: 'ID de la ubicación' })
  @ApiResponse({ status: 200, description: 'Ubicación actualizada' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada' })
  async update(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar ubicación (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID de la ubicación' })
  @ApiResponse({ status: 200, description: 'Ubicación eliminada' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada' })
  async remove(@Param('id', ParseIdPipe) id: number) {
    return this.locationsService.remove(id);
  }
}
