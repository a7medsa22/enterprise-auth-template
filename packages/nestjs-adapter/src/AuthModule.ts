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
import { JwtTokenGenerator } from './infrastructure/security/JwtTokenGenerator';
import { BcryptHasher } from './infrastructure/security/BcryptHasher';
import { JwtStrategy } from './presentation/strategies/JwtStrategy';
import { LocalStrategy } from './presentation/strategies/LocalStrategy';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { LocalAuthGuard } from './presentation/guards/local-auth.guard';
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

export interface AuthModuleOptions {
    cacheProvider?: 'redis' | 'memory';
    redisClient?: any;
}
@Global()
@Module({})
export class AuthModule {
    static forRoot(options: AuthModuleOptions = {}): DynamicModule {
        const providers: Provider[] = [
            // Use Cases
            {
                provide: RegisterUserUseCase,
                useFactory: (
                    userRepo: IUserRepository,
                    passwordHasher: IPasswordHasher,
                    tokenGenerator: ITokenGenerator,
                    emailSender: IEmailSender,
                    eventBus: IEventBus,
                    logger: ILogger,
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
                    rateLimiter: IRateLimiter,
                    tokenGenerator: ITokenGenerator,
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
                useFactory: (userRepo: IUserRepository, eventBus: IEventBus, logger: ILogger) =>
                    new VerifyEmail(userRepo, eventBus, logger),
                inject: ['IUserRepository', 'IEventBus', 'ILogger'],
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

            // Stub implementations (to be replaced)
            {
                provide: 'IEmailSender',
                useValue: {
                    send: async () => ({ isSuccess: true }),
                    sendVerificationEmail: async () => ({ isSuccess: true }),
                },
            },
            {
                provide: 'IEventBus',
                useValue: {
                    publish: async () => { },
                    subscribe: () => { },
                },
            },
            {
                provide: 'ILogger',
                useValue: {
                    debug: console.debug,
                    info: console.log,
                    warn: console.warn,
                    error: console.error,
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

        return {
            module: AuthModule,
            imports: [
                ConfigModule.forFeature(authConfig),
                ConfigModule.forFeature(databaseConfig),
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
            ],
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
            ],
        };
    } 
} 
