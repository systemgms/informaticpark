import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { ConfirmMovementDto } from './dto/confirm-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { fileFilter, uploadToBlob } from '../common/utils/blob-upload.util';
import { AuthUser } from '../common/types/auth-user.type';

@ApiTags('movements')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('assets/:assetId/movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Iniciar traspaso — queda PENDIENTE hasta que el receptor confirme',
  })
  @ApiParam({ name: 'assetId', description: 'ID del activo' })
  async create(
    @Param('assetId', ParseIdPipe) assetId: number,
    @Body() dto: CreateMovementDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.movementsService.create(
      assetId,
      dto,
      req.user?.sub,
      req.user?.role,
      req.user?.custodianId,
    );
  }

  @Patch(':movementId/confirm')
  @UseInterceptors(
    FileInterceptor('acta', {
      storage: memoryStorage(),
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Confirmar recepción — subir acta firmada por ambas partes',
  })
  @ApiParam({ name: 'assetId', description: 'ID del activo' })
  @ApiParam({ name: 'movementId', description: 'ID del traspaso' })
  async confirm(
    @Param('assetId', ParseIdPipe) assetId: number,
    @Param('movementId', ParseIdPipe) movementId: number,
    @Body() dto: ConfirmMovementDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: AuthUser },
  ) {
    let actaUrl: string | null = null;
    if (file) {
      actaUrl = await uploadToBlob('actas', file);
    }
    return this.movementsService.confirm(
      assetId,
      movementId,
      dto,
      actaUrl,
      req.user?.sub,
      req.user?.role,
      req.user?.custodianId,
    );
  }

  @Patch(':movementId/reject')
  @ApiOperation({
    summary: 'Rechazar traspaso — el bien permanece con el custodio actual',
  })
  @ApiParam({ name: 'assetId', description: 'ID del activo' })
  @ApiParam({ name: 'movementId', description: 'ID del traspaso' })
  async reject(
    @Param('assetId', ParseIdPipe) assetId: number,
    @Param('movementId', ParseIdPipe) movementId: number,
    @Req() req: { user: AuthUser },
  ) {
    return this.movementsService.reject(
      assetId,
      movementId,
      req.user?.role,
      req.user?.custodianId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Historial de traspasos del activo' })
  @ApiParam({ name: 'assetId', description: 'ID del activo' })
  findAll(@Param('assetId', ParseIdPipe) assetId: number) {
    return this.movementsService.findAll(assetId);
  }

  @Get('pending/me')
  @ApiOperation({
    summary: 'Traspasos pendientes de confirmar para el custodio autenticado',
  })
  async pendingForMe(@Req() req: { user: AuthUser }) {
    const custodianId = req.user?.custodianId;
    if (!custodianId) return [];
    return this.movementsService.findPendingForCustodian(custodianId);
  }
}
