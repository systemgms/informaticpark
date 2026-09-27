import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AssetCondition } from '@prisma/client';
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
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { parsePagination } from '../common/pagination/parse-pagination';

@ApiTags('assets')
@ApiBearerAuth('JWT')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear activo (solo ADMIN)' })
  @ApiBody({ type: CreateAssetDto })
  @ApiResponse({ status: 201, description: 'Activo creado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  async create(
    @Body(TrimStringsPipe) dto: CreateAssetDto,
    @Req() req: { user: AuthUser },
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
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: AssetCondition,
    description: 'Filtrar por condición del activo',
  })
  @ApiResponse({ status: 200, description: 'Lista de activos' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
    @Query('condition', new ParseEnumPipe(AssetCondition, { optional: true }))
    condition?: AssetCondition,
    @Req() req?: { user: AuthUser },
  ) {
    const { page: pageNum, limit: limitNum } = parsePagination(page, limit);
    return this.assetsService.findAll(
      pageNum,
      limitNum,
      search,
      req?.user,
      condition,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas agregadas de activos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de activos' })
  stats(@Req() req?: { user: AuthUser }) {
    return this.assetsService.stats(req?.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener activo por ID' })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo encontrado' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  findOne(
    @Param('id', ParseIdPipe) id: number,
    @Req() req: { user: AuthUser },
  ) {
    return this.assetsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar activo (solo ADMIN)' })
  @ApiBody({ type: UpdateAssetDto })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body(TrimStringsPipe) dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar activo (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del activo' })
  @ApiResponse({ status: 200, description: 'Activo eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Activo no encontrado' })
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.assetsService.remove(id);
  }
}
