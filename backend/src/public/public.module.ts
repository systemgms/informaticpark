import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { AssetsModule } from '../assets/assets.module';
import { CustodiansModule } from '../custodians/custodians.module';

@Module({
  imports: [AssetsModule, CustodiansModule],
  controllers: [PublicController],
})
export class PublicModule {}
