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

function getTypeOrmOptions(): DataSourceOptions {
  const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
  const useSsl =
    process.env.DB_SSL === 'true' ||
    (dbUrl ? dbUrl.includes('sslmode=') || dbUrl.includes('neon.tech') : false);

  const sslOption = useSsl ? { rejectUnauthorized: false } : false;

  if (dbUrl) {
    return {
      type: 'postgres',
      url: dbUrl,
      ssl: sslOption,
      entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: 50,
        min: 10,
        idleTimeoutMillis: 30000,
      },
    } as DataSourceOptions;
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth_db',
    ssl: sslOption,
    entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 50,
      min: 10,
      idleTimeoutMillis: 30000,
    },
  } as DataSourceOptions;
}

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
      db: 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    tls: tlsOption,
    db: 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

const isRedisConfigured =
  process.env.NODE_ENV !== 'test' &&
  process.env.CACHE_PROVIDER === 'redis' &&
  !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL) &&
  !(process.env.REDIS_URL || '').includes('your-endpoint');

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
    TypeOrmModule.forRoot({
      ...(process.env.NODE_ENV === 'test'
        ? ({
            type: 'sqljs',
            autoSave: false,
            location: 'auth_e2e',
            entities: [UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity],
            logging: false,
            synchronize: true,
          } as DataSourceOptions)
        : getTypeOrmOptions()),
      autoLoadEntities: true,
    }),

    // Auth Module
    AuthModule.forRoot({
      cacheProvider: isRedisConfigured ? 'redis' : 'memory',
      redisClient: isRedisConfigured ? createRedisClient() : undefined,
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
