import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { shouldSkipMutationsThrottling } from './common/throttler/mutations-throttler.skip-if';
import { AuthModule } from './auth/auth.module';
import { JwtConfigModule } from './auth/jwt-config.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { CustodiansModule } from './custodians/custodians.module';
import { LocationsModule } from './locations/locations.module';
import { MovementsModule } from './movements/movements.module';
import { HealthModule } from './health/health.module';
import { BrandSettingsModule } from './brand-settings/brand-settings.module';
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
        // Applies only to non-safe HTTP methods: `@nestjs/throttler` runs
        // every named throttler on every route, so without this predicate
        // GET/HEAD/OPTIONS reads would also be capped at 20/min.
        skipIf: shouldSkipMutationsThrottling,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtConfigModule,
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AssetsModule,
    CustodiansModule,
    LocationsModule,
    MovementsModule,
    BrandSettingsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
