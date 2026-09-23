import { Module } from '@nestjs/common';
import { BrandSettingsController } from './brand-settings.controller';
import { BrandSettingsService } from './brand-settings.service';

@Module({
  controllers: [BrandSettingsController],
  providers: [BrandSettingsService],
})
export class BrandSettingsModule {}
