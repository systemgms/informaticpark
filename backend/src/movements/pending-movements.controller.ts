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
import { CreateBulkMovementDto } from './dto/create-bulk-movement.dto';
import { ConfirmMovementDto } from './dto/confirm-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { fileFilter, uploadToBlob } from '../common/utils/blob-upload.util';
import { AuthUser } from '../common/types/auth-user.type';

@ApiTags('movements')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('movements')
export class PendingMovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get('pending')
  @ApiOperation({
    summary: 'Traspasos pendientes de confirmar para el custodio autenticado',
  })
  async pendingForMe(@Req() req: { user: { custodianId?: number | null } }) {
    const custodianId = req.user?.custodianId;
    if (!custodianId) return [];
    return this.movementsService.findPendingForCustodian(custodianId);
  }

  @Post('bulk')
  @ApiOperation({
    summary:
      'Traspasar múltiples activos — crea un movimiento por cada activo con el mismo destino',
  })
  async createBulk(
    @Body() dto: CreateBulkMovementDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.movementsService.createBulk(
      dto,
      req.user?.sub,
      req.user?.role,
      req.user?.custodianId,
    );
  }

  @Patch('bulk/:groupId/confirm')
  @UseInterceptors(
    FileInterceptor('acta', {
      storage: memoryStorage(),
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Confirmar traspaso grupal — subir acta firmada y confirmar todos los movimientos del grupo',
  })
  @ApiParam({ name: 'groupId', description: 'ID del grupo de traspaso' })
  async confirmBulk(
    @Param('groupId') groupId: string,
    @Body() dto: ConfirmMovementDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: AuthUser },
  ) {
    let actaUrl: string | null = null;
    if (file) {
      actaUrl = await uploadToBlob('actas', file);
    }
    return this.movementsService.confirmBulk(
      groupId,
      dto,
      actaUrl,
      req.user?.sub,
      req.user?.role,
      req.user?.custodianId,
    );
  }

  @Patch('bulk/:groupId/reject')
  @ApiOperation({
    summary:
      'Rechazar traspaso grupal — rechaza todos los movimientos del grupo',
  })
  @ApiParam({ name: 'groupId', description: 'ID del grupo de traspaso' })
  async rejectBulk(
    @Param('groupId') groupId: string,
    @Req() req: { user: AuthUser },
  ) {
    return this.movementsService.rejectBulk(
      groupId,
      req.user?.role,
      req.user?.custodianId,
    );
  }
}
