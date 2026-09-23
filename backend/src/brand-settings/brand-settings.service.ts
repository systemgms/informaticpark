import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandSettingsDto } from './dto/update-brand-settings.dto';

@Injectable()
export class BrandSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.brandSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.brandSettings.create({
        data: {
          appName: 'Parque Informático',
          primaryColor: '#4f46e5',
          secondaryColor: '#6366f1',
          accentColor: '#e0e7ff',
        },
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdateBrandSettingsDto) {
    const current = await this.getSettings();
    return this.prisma.brandSettings.update({
      where: { id: current.id },
      data: dto,
    });
  }
}
