import { Module } from '@nestjs/common';
import { CustodiansService } from './custodians.service';
import { CustodiansController } from './custodians.controller';
import { JwtConfigModule } from '../auth/jwt-config.module';

@Module({
  imports: [JwtConfigModule],
  controllers: [CustodiansController],
  providers: [CustodiansService],
  exports: [CustodiansService],
})
export class CustodiansModule {}
