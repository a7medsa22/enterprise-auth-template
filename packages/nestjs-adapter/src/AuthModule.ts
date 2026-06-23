import {
  ChangePassword,
  IEmailSender,
  IEventBus,
  ILogger,
  IPasswordHasher,
  IRateLimiter,
  ITokenGenerator,
  ITokenRepository,
  IUserRepository,
  LoginUser,
  LogoutAllDevices,
  LogoutUser,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  VerifyEmail,
} from '@auth-template/core';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TypeOrmUserRepository } from './presentation/typeorm/repositories/TypeOrmUserRepository';
import { TypeOrmTokenRepository } from './presentation/typeorm/repositories/TypeOrmTokenRepository';
import { JwtTokenGenerator } from './infrastructure/security/JwtTokenGenerator';
import { BcryptHasher } from './infrastructure/security/BcryptHasher';
import { JwtStrategy } from './presentation/strategies/JwtStrategy';
import { LocalStrategy } from './presentation/strategies/LocalStrategy';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { RedisCache } from './infrastructure/security/RedisCache';
import { MemoryCache } from './infrastructure/security/MemoryCache';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './presentation/typeorm/entities/UserEntity';
import { SessionEntity } from './presentation/typeorm/entities/SessionEntity';
import { RefreshTokenEntity } from './presentation/typeorm/entities/RefreshTokenEntity';
import { AuditLogEntity } from './presentation/typeorm/entities/AuditLogEntity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './presentation/controllers/AuthController';
import { Reflector } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import emailConfig from './config/email.config';
import { NodemailerEmailSender } from './infrastructure/email/NodemailerEmailSender';
import { QueueEmailSender } from './infrastructure/email/QueueEmailSender';
import { EmailProcessor } from './infrastructure/email/EmailProcessor';

export interface AuthModuleOptions {
  cacheProvider?: 'redis' | 'memory';
  redisClient?: any;
}
@Global()
@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions = {}): DynamicModule {
    if (options.cacheProvider === 'redis' && !options.redisClient) {
      throw new Error('Redis client required for redis cache provider');
    }

    const providers: Provider[] = [
      // Use Cases
      {
        provide: RegisterUserUseCase,
        useFactory: (
          userRepo: IUserRepository,
          emailSender: IEmailSender,
          passwordHasher: IPasswordHasher,
          tokenGenerator: ITokenGenerator,
          logger: ILogger,
          eventBus: IEventBus,
        ) =>
          new RegisterUserUseCase(
            userRepo,
            emailSender,
            passwordHasher,
            tokenGenerator,
            logger,
            eventBus,
          ),
        inject: [
          'IUserRepository',
          'IEmailSender',
          'IPasswordHasher',
          'ITokenGenerator',
          'ILogger',
          'IEventBus',
        ],
      },
      {
        provide: LoginUser,
        useFactory: (
          userRepo: IUserRepository,
          passwordHasher: IPasswordHasher,
          tokenGenerator: ITokenGenerator,
          rateLimiter: IRateLimiter,
          logger: ILogger,
          eventBus: IEventBus,
        ) => new LoginUser(userRepo, passwordHasher, tokenGenerator, rateLimiter, logger, eventBus),
        inject: [
          'IUserRepository',
          'IPasswordHasher',
          'ITokenGenerator',
          'IRateLimiter',
          'ILogger',
          'IEventBus',
        ],
      },
      {
        provide: RefreshTokenUseCase,
        useFactory: (
          userRepo: IUserRepository,
          tokenRepository: ITokenRepository,
          tokenGenerator: ITokenGenerator,
          logger: ILogger,
        ) => new RefreshTokenUseCase(userRepo, tokenRepository, tokenGenerator, logger),
        inject: ['IUserRepository', 'ITokenRepository', 'ITokenGenerator', 'ILogger'],
      },
      {
        provide: LogoutUser,
        useFactory: (tokenRepository: ITokenRepository, logger: ILogger) =>
          new LogoutUser(tokenRepository, logger),
        inject: ['ITokenRepository', 'ILogger'],
      },
      {
        provide: LogoutAllDevices,
        useFactory: (tokenRepository: ITokenRepository, logger: ILogger) =>
          new LogoutAllDevices(tokenRepository, logger),
        inject: ['ITokenRepository', 'ILogger'],
      },
      {
        provide: VerifyEmail,
        useFactory: (
          userRepo: IUserRepository,
          tokenGenerator: ITokenGenerator,
          eventBus: IEventBus,
          logger: ILogger,
        ) => new VerifyEmail(userRepo, tokenGenerator, eventBus, logger),
        inject: ['IUserRepository', 'ITokenGenerator', 'IEventBus', 'ILogger'],
      },
      {
        provide: ChangePassword,
        useFactory: (
          userRepo: IUserRepository,
          passwordHasher: IPasswordHasher,
          eventBus: IEventBus,
          logger: ILogger,
        ) => new ChangePassword(userRepo, passwordHasher, eventBus, logger),
        inject: ['IUserRepository', 'IPasswordHasher', 'IEventBus', 'ILogger'],
      },

      // Repositories
      {
        provide: 'IUserRepository',
        useClass: TypeOrmUserRepository,
      },
      {
        provide: 'ITokenRepository',
        useClass: TypeOrmTokenRepository,
      },

      // Services
      {
        provide: 'IPasswordHasher',
        useClass: BcryptHasher,
      },
      {
        provide: 'ITokenGenerator',
        useClass: JwtTokenGenerator,
      },

      // Strategies
      JwtStrategy,
      LocalStrategy,

      //Guards
      JwtAuthGuard,
      RolesGuard,
      Reflector,

      // Stub implementations (to be replaced)
      {
        provide: 'IEventBus',
        useValue: {
          publish: async () => {},
          subscribe: () => {},
        },
      },
      {
        provide: 'ILogger',
        useValue: {
          debug: (...args: any[]) => console.debug(...args),
          info: (...args: any[]) => console.log(...args),
          warn: (...args: any[]) => console.warn(...args),
          error: (...args: any[]) => console.error(...args),
        },
      },
      {
        provide: 'IRateLimiter',
        useValue: {
          check: async () => ({
            isSuccess: true,
            getValue: () => ({ allowed: true, remaining: 100, resetAt: new Date() }),
          }),
          reset: async () => ({ isSuccess: true }),
        },
      },
    ];

    // Add cache provider
    if (options.cacheProvider === 'redis' && options.redisClient) {
      providers.push(
        {
          provide: 'REDIS_CLIENT',
          useValue: options.redisClient,
        },
        {
          provide: 'ICacheProvider',
          useClass: RedisCache,
        },
      );
    } else {
      providers.push({
        provide: 'ICacheProvider',
        useClass: MemoryCache,
      });
    }

    // Register email providers
    providers.push(NodemailerEmailSender);

    if (options.cacheProvider === 'redis') {
      providers.push(EmailProcessor, {
        provide: 'IEmailSender',
        useClass: QueueEmailSender,
      });
    } else {
      providers.push({
        provide: 'IEmailSender',
        useClass: NodemailerEmailSender,
      });
    }

    const importsArray: any[] = [
      ConfigModule.forFeature(authConfig),
      ConfigModule.forFeature(databaseConfig),
      ConfigModule.forFeature(emailConfig),
      TypeOrmModule.forFeature([UserEntity, SessionEntity, RefreshTokenEntity, AuditLogEntity]),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.get('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: configService.get('JWT_ACCESS_EXPIRATION'),
          },
        }),
      }),
    ];

    if (options.cacheProvider === 'redis') {
      importsArray.push(
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            redis: {
              host: configService.get('REDIS_HOST', 'localhost'),
              port: parseInt(configService.get('REDIS_PORT', '6379'), 10),
            },
          }),
        }),
        BullModule.registerQueue({
          name: 'email',
        }),
      );
    }

    return {
      module: AuthModule,
      imports: importsArray,
      controllers: [AuthController],
      providers,
      exports: [
        RegisterUserUseCase,
        LoginUser,
        RefreshTokenUseCase,
        LogoutUser,
        JwtAuthGuard,
        RolesGuard,
        'IUserRepository',
        'IPasswordHasher',
        'ITokenGenerator',
        'IEmailSender',
        Reflector,
      ],
    };
  }
}
