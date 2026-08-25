import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required. Set it in your .env file.');
        }
        if (secret.length < 32) {
          throw new Error(
            'JWT_SECRET must be at least 32 characters long for security.',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<StringValue>(
              'JWT_EXPIRES_IN',
              '1h' as StringValue,
            ),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
