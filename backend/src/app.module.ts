import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtConfigModule } from './auth/jwt-config.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { CustodiansModule } from './custodians/custodians.module';
import { LocationsModule } from './locations/locations.module';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'mutations',
        ttl: 60000,
        limit: 20,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtConfigModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    AssetsModule,
    CustodiansModule,
    LocationsModule,
    MovementsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
