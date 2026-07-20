import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { APP_GUARD, Reflector } from '@nestjs/core';
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

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  const isTls =
    process.env.REDIS_TLS === 'true' ||
    (redisUrl
      ? redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.com')
      : (process.env.REDIS_HOST || '').includes('upstash.com'));

  const tlsOption = isTls ? { rejectUnauthorized: false } : undefined;

  if (redisUrl) {
    return new Redis(redisUrl, {
      tls: tlsOption,
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    tls: tlsOption,
  });
}

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
          useFactory: (configService: ConfigService) => {
            const dbUrl =
              configService.get<string>('DATABASE_URL') || configService.get<string>('DB_URL');
            const useSsl =
              configService.get<string>('DB_SSL') === 'true' ||
              (dbUrl ? dbUrl.includes('sslmode=') || dbUrl.includes('neon.tech') : false);

            const sslOption = useSsl ? { rejectUnauthorized: false } : false;

            if (dbUrl) {
              return {
                type: 'postgres',
                url: dbUrl,
                ssl: sslOption,
                entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
                synchronize: configService.get('NODE_ENV') !== 'production',
                logging: configService.get('NODE_ENV') === 'development',
                extra: {
                  max: 50,
                  min: 10,
                  idleTimeoutMillis: 30000,
                },
              };
            }

            return {
              type: 'postgres',
              host: configService.get('DB_HOST', 'localhost'),
              port: configService.get('DB_PORT', 5432),
              username: configService.get('DB_USERNAME', 'postgres'),
              password: configService.get('DB_PASSWORD', 'postgres'),
              database: configService.get('DB_NAME', 'auth_db'),
              ssl: sslOption,
              entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
              synchronize: configService.get('NODE_ENV') !== 'production',
              logging: configService.get('NODE_ENV') === 'development',
              extra: {
                max: 50,
                min: 10,
                idleTimeoutMillis: 30000,
              },
            };
          },
        }),

    // Auth Module
    AuthModule.forRoot({
      cacheProvider:
        process.env.NODE_ENV === 'test'
          ? 'memory'
          : process.env.CACHE_PROVIDER === 'redis' ||
              process.env.REDIS_URL ||
              process.env.UPSTASH_REDIS_URL
            ? 'redis'
            : 'memory',
      redisClient:
        process.env.NODE_ENV !== 'test' &&
        (process.env.CACHE_PROVIDER === 'redis' ||
          process.env.REDIS_URL ||
          process.env.UPSTASH_REDIS_URL)
          ? createRedisClient()
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
