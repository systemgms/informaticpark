import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  private readonly maxExportLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.maxExportLimit = this.configService.get<number>(
      'LOCATIONS_MAX_EXPORT',
      500,
    );
  }

  async create(dto: CreateLocationDto) {
    return this.prisma.location.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.LocationWhereInput = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { canton: { contains: search, mode: 'insensitive' } },
              { parroquia: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      data: locations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllWithoutPagination() {
    const limit = Math.min(this.maxExportLimit, 1000); // Cap at 1000 max to prevent abuse
    return this.prisma.location.findMany({
      where: { isDeleted: false },
      orderBy: { canton: 'asc' },
      take: limit,
    });
  }

  async findOne(id: number) {
    const location = await this.prisma.location.findUnique({
      where: { id, isDeleted: false },
    });
    if (!location) {
      throw new NotFoundException(`Ubicación con id ${id} no encontrada`);
    }
    return location;
  }

  async update(id: number, dto: UpdateLocationDto) {
    await this.findOne(id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.location.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
