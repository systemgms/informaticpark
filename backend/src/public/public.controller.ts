import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { AssetsService } from '../assets/assets.service';
import { CustodiansService } from '../custodians/custodians.service';
import { MaxLengthPipe } from '../common/pipes/max-length.pipe';
import { parsePagination } from '../common/pagination/parse-pagination';

// Anonymous, read-only endpoints for the public inventory pages. Each item
// exposes a narrow field set on purpose — no custodian or identifier data.
@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly custodiansService: CustodiansService,
  ) {}

  @Get('assets')
  @ApiOperation({
    summary: 'Listar activos públicos (campos limitados, sin custodio)',
  })
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
    description: 'Búsqueda por nombre, código, marca o modelo',
  })
  @ApiResponse({ status: 200, description: 'Lista pública de activos' })
  findAssets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
  ) {
    const { page: pageNum, limit: limitNum } = parsePagination(page, limit);
    return this.assetsService.findPublic(pageNum, limitNum, search);
  }

  @Get('custodians')
  @ApiOperation({
    summary: 'Listar custodios públicos (campos limitados, sin identificador)',
  })
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
    description: 'Búsqueda por nombre o unidad',
  })
  @ApiResponse({ status: 200, description: 'Lista pública de custodios' })
  findCustodians(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search', new MaxLengthPipe(100)) search?: string,
  ) {
    const { page: pageNum, limit: limitNum } = parsePagination(page, limit);
    return this.custodiansService.findPublic(pageNum, limitNum, search);
  }
}
