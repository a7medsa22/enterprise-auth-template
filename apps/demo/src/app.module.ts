import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule, JwtAuthGuard, RolesGuard } from '@auth-template/nestjs-adapter';
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    process.env.NODE_ENV === 'test'
      ? TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          location: 'auth_e2e',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
      cacheProvider: 'memory', // or 'redis'
    }),

    // Feature Modules
    HealthModule,
  ],
  providers: [
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
export class AppModule { }
