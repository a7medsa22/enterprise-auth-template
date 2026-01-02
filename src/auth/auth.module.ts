import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';
import { AuthDomainService } from './services/auth-domain.service';
import { BcryptPasswordAdapter } from './adapters/bcrypt-password.adapter';
import { UsersServiceAdapter } from './adapters/users-service.adapter';
import { TokenService } from './services/token.service';
import { RedisTokenStorageAdapter } from './adapters/redis-token-storage.adapter';
import { AuthController } from './auth.controller';
import { Redis } from 'ioredis';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports:[
    PassportModule.register({defaultStrategy:'jwt'}),
     JwtModule.registerAsync({
      useFactory: async (config:ConfigService)=>
    ({
      secret:config.get('JWT_SECRET'),
      signOptions:{expiresIn:config.get('JWT_EXPIRES_IN')},
    }),
    inject:[ConfigService]
     }),
     forwardRef(() => UsersModule),
     JwtModule,
     ConfigModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthDomainService,
    TokenService,
    BcryptPasswordAdapter,
    UsersServiceAdapter,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'TokenStorage',
      useClass: RedisTokenStorageAdapter,
    },
  ],
  exports:[AuthService],
})
export class AuthModule {}