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
import { CustodiansService } from './custodians.service';
import { Roles } from '../auth/roles.decorator';
import { CreateCustodianDto } from './dto/create-custodian.dto';
import { UpdateCustodianDto } from './dto/update-custodian.dto';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { TrimStringsPipe } from '../common/pipes/trim-strings.pipe';
import { MaxLengthPipe } from '../common/pipes/max-length.pipe';

@ApiTags('custodians')
@ApiBearerAuth('JWT')
@Controller('custodians')
@Roles('ADMIN')
export class CustodiansController {
  constructor(private readonly custodiansService: CustodiansService) {}

  @Post()
  @ApiOperation({ summary: 'Crear custodio (solo ADMIN)' })
  @ApiBody({ type: CreateCustodianDto })
  @ApiResponse({ status: 201, description: 'Custodio creado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 409, description: 'Identificador duplicado' })
  async create(@Body(TrimStringsPipe) dto: CreateCustodianDto) {
    return this.custodiansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar custodios' })
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
    description: 'Búsqueda por nombre o identificador',
  })
  @ApiResponse({ status: 200, description: 'Lista de custodios' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.custodiansService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener custodio por ID' })
  @ApiParam({ name: 'id', description: 'ID del custodio' })
  @ApiResponse({ status: 200, description: 'Custodio encontrado' })
  @ApiResponse({ status: 404, description: 'Custodio no encontrado' })
  async findOne(@Param('id', ParseIdPipe) id: number) {
    return this.custodiansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar custodio (solo ADMIN)' })
  @ApiBody({ type: UpdateCustodianDto })
  @ApiParam({ name: 'id', description: 'ID del custodio' })
  @ApiResponse({ status: 200, description: 'Custodio actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Custodio no encontrado' })
  @ApiResponse({ status: 409, description: 'Identificador duplicado' })
  async update(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: UpdateCustodianDto,
  ) {
    return this.custodiansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar custodio (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del custodio' })
  @ApiResponse({ status: 200, description: 'Custodio eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Custodio no encontrado' })
  async remove(@Param('id', ParseIdPipe) id: number) {
    return this.custodiansService.remove(id);
  }
}
