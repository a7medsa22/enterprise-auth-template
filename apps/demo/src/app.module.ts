import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';
import {
  AuthModule,
  JwtAuthGuard,
  RolesGuard,
  UserEntity,
  SessionEntity,
  RefreshTokenEntity,
  AuditLogEntity,
} from '@auth-template/nestjs-adapter';
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { Redis } from 'ioredis';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env',
        '.env.test',
        '../../.env.local',
        '../../.env',
        '../../.env.test',
      ],
    }),

    // Database
    process.env.NODE_ENV === 'test'
      ? TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          location: 'auth_e2e',
          entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
          logging: false,
          synchronize: true,
        } as DataSourceOptions)
      : TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_NAME', 'auth_db'),
            entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
            synchronize: configService.get('NODE_ENV') !== 'production',
            logging: configService.get('NODE_ENV') === 'development',
            extra: {
              max: 50,
              min: 10,
              idleTimeoutMillis: 30000,
            },
          }),
        }),

    // Auth Module
    AuthModule.forRoot({
      cacheProvider:
        process.env.NODE_ENV === 'test'
          ? 'memory'
          : process.env.CACHE_PROVIDER === 'redis'
            ? 'redis'
            : 'memory',
      redisClient:
        process.env.NODE_ENV !== 'test' && process.env.CACHE_PROVIDER === 'redis'
          ? new Redis({
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
            })
          : undefined,
    }),

    // Feature Modules
    HealthModule,
  ],
  providers: [
    Reflector,
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
