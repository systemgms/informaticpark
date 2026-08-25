import { Module } from '@nestjs/common';
import { MovementsController } from './movements.controller';
import { PendingMovementsController } from './pending-movements.controller';
import { MovementsService } from './movements.service';
import { JwtConfigModule } from '../auth/jwt-config.module';

@Module({
  imports: [JwtConfigModule],
  controllers: [MovementsController, PendingMovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
