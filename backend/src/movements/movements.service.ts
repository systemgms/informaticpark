import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateBulkMovementDto } from './dto/create-bulk-movement.dto';
import { ConfirmMovementDto } from './dto/confirm-movement.dto';
import { randomUUID } from 'crypto';

const MOVEMENT_INCLUDE = {
  fromCustodian: true,
  toCustodian: true,
  fromLocation: true,
  toLocation: true,
  registeredBy: { select: { id: true, name: true, email: true } },
  confirmedBy: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    assetId: number,
    dto: CreateMovementDto,
    registeredByUserId?: number,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset)
      throw new NotFoundException(`Activo con id ${assetId} no encontrado`);

    if (callerRole !== 'ADMIN') {
      if (!callerCustodianId || asset.custodianId !== callerCustodianId) {
        throw new ForbiddenException(
          'Solo puedes registrar traspasos de activos bajo tu custodia',
        );
      }
    }

    // Validate destination custodian exists if provided
    if (dto.toCustodianId) {
      const custodian = await this.prisma.custodian.findUnique({
        where: { id: dto.toCustodianId, isDeleted: false },
      });
      if (!custodian) {
        throw new NotFoundException(
          `Custodio destino con id ${dto.toCustodianId} no encontrado`,
        );
      }
    }

    // Validate destination location exists if provided
    if (dto.toLocationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.toLocationId, isDeleted: false },
      });
      if (!location) {
        throw new NotFoundException(
          `Ubicación destino con id ${dto.toLocationId} no encontrada`,
        );
      }
    }

    return this.prisma.assetMovement.create({
      data: {
        assetId,
        fromCustodianId: asset.custodianId,
        toCustodianId: dto.toCustodianId ?? null,
        fromLocationId: asset.locationId,
        toLocationId: dto.toLocationId ?? null,
        note: dto.note,
        registeredByUserId,
        status: 'PENDIENTE',
      },
      include: MOVEMENT_INCLUDE,
    });
  }

  async confirm(
    assetId: number,
    movementId: number,
    dto: ConfirmMovementDto,
    actaUrl: string | null,
    callerUserId?: number,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const movement = await this.prisma.assetMovement.findUnique({
      where: { id: movementId },
    });

    if (!movement || movement.assetId !== assetId) {
      throw new NotFoundException('Traspaso no encontrado');
    }
    if (movement.status !== 'PENDIENTE') {
      throw new BadRequestException('Este traspaso ya fue procesado');
    }

    if (callerRole !== 'ADMIN') {
      if (!callerCustodianId || movement.toCustodianId !== callerCustodianId) {
        throw new ForbiddenException(
          'Solo el custodio receptor puede confirmar este traspaso',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const confirmed = await tx.assetMovement.update({
        where: { id: movementId },
        data: {
          status: 'COMPLETADO',
          confirmedAt: new Date(),
          confirmedByUserId: callerUserId,
          actaUrl: actaUrl ?? movement.actaUrl,
          ...(dto.note
            ? {
                note: movement.note
                  ? `${movement.note} | Recepción: ${dto.note}`
                  : dto.note,
              }
            : {}),
        },
        include: MOVEMENT_INCLUDE,
      });

      const updateData: Record<string, unknown> = {};
      if (movement.toCustodianId !== null)
        updateData.custodianId = movement.toCustodianId;
      if (movement.toLocationId !== null)
        updateData.locationId = movement.toLocationId;

      if (Object.keys(updateData).length > 0) {
        await tx.asset.update({ where: { id: assetId }, data: updateData });
      }

      return confirmed;
    });
  }

  async reject(
    assetId: number,
    movementId: number,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const movement = await this.prisma.assetMovement.findUnique({
      where: { id: movementId },
    });

    if (!movement || movement.assetId !== assetId) {
      throw new NotFoundException('Traspaso no encontrado');
    }
    if (movement.status !== 'PENDIENTE') {
      throw new BadRequestException('Este traspaso ya fue procesado');
    }

    if (callerRole !== 'ADMIN') {
      if (!callerCustodianId || movement.toCustodianId !== callerCustodianId) {
        throw new ForbiddenException(
          'Solo el custodio receptor puede rechazar este traspaso',
        );
      }
    }

    return this.prisma.assetMovement.update({
      where: { id: movementId },
      data: { status: 'RECHAZADO' },
      include: MOVEMENT_INCLUDE,
    });
  }

  async findAll(assetId: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset)
      throw new NotFoundException(`Activo con id ${assetId} no encontrado`);

    return this.prisma.assetMovement.findMany({
      where: { assetId },
      include: MOVEMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingForCustodian(custodianId: number) {
    return this.prisma.assetMovement.findMany({
      where: { toCustodianId: custodianId, status: 'PENDIENTE' },
      include: {
        ...MOVEMENT_INCLUDE,
        asset: { select: { id: true, assetName: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBulk(
    dto: CreateBulkMovementDto,
    registeredByUserId?: number,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const groupId = randomUUID();

    const assets = await this.prisma.asset.findMany({
      where: { id: { in: dto.assetIds } },
    });

    if (assets.length !== dto.assetIds.length) {
      throw new NotFoundException('Uno o más activos no fueron encontrados');
    }

    if (callerRole !== 'ADMIN') {
      for (const asset of assets) {
        if (!callerCustodianId || asset.custodianId !== callerCustodianId) {
          throw new ForbiddenException(
            `No tienes permiso para traspasar el activo "${asset.assetName}" (id: ${asset.id})`,
          );
        }
      }
    }

    const movements = await this.prisma.$transaction(
      assets.map((asset) =>
        this.prisma.assetMovement.create({
          data: {
            groupId,
            assetId: asset.id,
            fromCustodianId: asset.custodianId,
            toCustodianId: dto.toCustodianId ?? null,
            fromLocationId: asset.locationId,
            toLocationId: dto.toLocationId ?? null,
            note: dto.note,
            registeredByUserId,
            status: 'PENDIENTE',
          },
          include: MOVEMENT_INCLUDE,
        }),
      ),
    );

    return { groupId, movements };
  }

  async confirmBulk(
    groupId: string,
    dto: ConfirmMovementDto,
    actaUrl: string | null,
    callerUserId?: number,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const movements = await this.prisma.assetMovement.findMany({
      where: { groupId, status: 'PENDIENTE' },
    });

    if (movements.length === 0) {
      throw new NotFoundException(
        'Traspaso grupal no encontrado o ya procesado',
      );
    }

    if (callerRole !== 'ADMIN') {
      for (const movement of movements) {
        if (
          !callerCustodianId ||
          movement.toCustodianId !== callerCustodianId
        ) {
          throw new ForbiddenException(
            'Solo el custodio receptor puede confirmar este traspaso',
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update all movements status in one query
      const confirmed = await tx.assetMovement.updateMany({
        where: { groupId, status: 'PENDIENTE' },
        data: {
          status: 'COMPLETADO',
          confirmedAt: new Date(),
          confirmedByUserId: callerUserId,
          ...(actaUrl ? { actaUrl } : {}),
          ...(dto.note ? { note: dto.note } : {}),
        },
      });

      // Group assets by their target custodian/location for batch updates
      const updatesByCustodian = new Map<number, number[]>();
      const updatesByLocation = new Map<number, number[]>();

      for (const movement of movements) {
        if (movement.toCustodianId != null) {
          const existing = updatesByCustodian.get(movement.toCustodianId) || [];
          existing.push(movement.assetId);
          updatesByCustodian.set(movement.toCustodianId, existing);
        }
        if (movement.toLocationId != null) {
          const existing = updatesByLocation.get(movement.toLocationId) || [];
          existing.push(movement.assetId);
          updatesByLocation.set(movement.toLocationId, existing);
        }
      }

      // Batch update assets by custodian
      for (const [custodianId, assetIds] of updatesByCustodian) {
        await tx.asset.updateMany({
          where: { id: { in: assetIds } },
          data: { custodianId },
        });
      }

      // Batch update assets by location
      for (const [locationId, assetIds] of updatesByLocation) {
        await tx.asset.updateMany({
          where: { id: { in: assetIds } },
          data: { locationId },
        });
      }

      return { groupId, count: confirmed.count };
    });
  }

  async rejectBulk(
    groupId: string,
    callerRole?: string,
    callerCustodianId?: number | null,
  ) {
    const movements = await this.prisma.assetMovement.findMany({
      where: { groupId, status: 'PENDIENTE' },
    });

    if (movements.length === 0) {
      throw new NotFoundException(
        'Traspaso grupal no encontrado o ya procesado',
      );
    }

    if (callerRole !== 'ADMIN') {
      for (const movement of movements) {
        if (
          !callerCustodianId ||
          movement.toCustodianId !== callerCustodianId
        ) {
          throw new ForbiddenException(
            'Solo el custodio receptor puede rechazar este traspaso',
          );
        }
      }
    }

    const rejected = await this.prisma.assetMovement.updateMany({
      where: { groupId, status: 'PENDIENTE' },
      data: { status: 'RECHAZADO' },
    });

    return { groupId, count: rejected.count };
  }
}
