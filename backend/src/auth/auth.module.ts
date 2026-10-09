import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtConfigModule } from './jwt-config.module';

@Module({
  imports: [UsersModule, JwtConfigModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
