import { Router, RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import {
  RegisterUserUseCase,
  LoginUser,
  RefreshTokenUseCase,
  LogoutUser,
  LogoutAllDevices,
  ChangePassword,
  VerifyEmail,
  Result,
} from '@auth-template/core';
import { AuthConfig, loadConfig } from './config';
<<<<<<< HEAD
import {
  BaseMemoryCache,
  BaseRedisCache,
  UserEntity,
  RefreshTokenEntity,
} from '@auth-template/typeorm';
=======
import { UserEntity } from './persistence/entities/UserEntity';
import { RefreshTokenEntity } from './persistence/entities/RefreshTokenEntity';
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
import { TypeOrmUserRepository } from './persistence/repositories/TypeOrmUserRepository';
import { TypeOrmTokenRepository } from './persistence/repositories/TypeOrmTokenRepository';
import { BcryptHasher } from './infrastructure/security/BcryptHasher';
import { JwtTokenGenerator } from './infrastructure/security/JwtTokenGenerator';
<<<<<<< HEAD
=======
import { MemoryCache } from './infrastructure/security/MemoryCache';
import { RedisCache } from './infrastructure/security/RedisCache';
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
import { NodemailerEmailSender } from './infrastructure/email/NodemailerEmailSender';
import { createJwtAuthMiddleware } from './middleware/jwtAuth.middleware';
import { createRolesMiddleware } from './middleware/roles.middleware';
import { createAuthRouter as buildAuthRouter } from './router/authRouter';

export interface ExpressAuthOptions {
  dataSource: DataSource;
  config?: Partial<AuthConfig>;
  cacheProvider?: 'redis' | 'memory';
  redisClient?: Redis;
}

export function createAuthRouter(options: ExpressAuthOptions): {
  router: Router;
  jwtMiddleware: RequestHandler;
  requireRoles: (...roles: string[]) => RequestHandler;
  useCases: {
    registerUser: RegisterUserUseCase;
    loginUser: LoginUser;
    refreshToken: RefreshTokenUseCase;
    logoutUser: LogoutUser;
    logoutAllDevices: LogoutAllDevices;
    verifyEmail: VerifyEmail;
    changePassword: ChangePassword;
  };
  repositories: {
    userRepository: TypeOrmUserRepository;
    tokenRepository: TypeOrmTokenRepository;
  };
  services: {
    passwordHasher: BcryptHasher;
    tokenGenerator: JwtTokenGenerator;
    cache: any;
    emailSender: NodemailerEmailSender;
  };
} {
  if (options.cacheProvider === 'redis' && !options.redisClient) {
    throw new Error('Redis client required for redis cache provider');
  }

  // 1. Initialize Config
  const config = loadConfig(options.config);

  // 2. Initialize Repositories
  const userRepoEntity = options.dataSource.getRepository(UserEntity);
  const tokenRepoEntity = options.dataSource.getRepository(RefreshTokenEntity);

  const userRepository = new TypeOrmUserRepository(userRepoEntity);
  const tokenRepository = new TypeOrmTokenRepository(tokenRepoEntity);

  // 3. Initialize Security & Cache
  const passwordHasher = new BcryptHasher(config.bcrypt.rounds);
  const tokenGenerator = new JwtTokenGenerator(config, tokenRepository);

  const cache =
    options.cacheProvider === 'redis' && options.redisClient
<<<<<<< HEAD
      ? new BaseRedisCache(options.redisClient)
      : new BaseMemoryCache();
=======
      ? new RedisCache(options.redisClient)
      : new MemoryCache();
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e

  // 4. Initialize Email Sender
  const emailSender = new NodemailerEmailSender(config);

  // 5. Initialize Stub Services (to match NestJS adapter implementation)
  const eventBus = {
    publish: async () => {},
    subscribe: () => {},
  };

  const logger = {
    debug: (...args: any[]) => console.debug('[AuthTemplate]', ...args),
    info: (...args: any[]) => console.log('[AuthTemplate]', ...args),
    warn: (...args: any[]) => console.warn('[AuthTemplate]', ...args),
    error: (message: string, error?: Error, context?: any) =>
      console.error('[AuthTemplate]', message, error || '', context || ''),
  };

  const rateLimiter = {
    check: async () => Result.ok({ allowed: true, remaining: 100, resetAt: new Date() }),
    reset: async () => Result.ok<void>(),
  };

  // 6. Instantiate Use Cases
  const registerUser = new RegisterUserUseCase(
    userRepository,
    emailSender,
    passwordHasher,
    tokenGenerator,
    logger,
<<<<<<< HEAD
    eventBus,
=======
    eventBus
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
  );

  const loginUser = new LoginUser(
    userRepository,
    passwordHasher,
    tokenGenerator,
    rateLimiter,
    logger,
<<<<<<< HEAD
    eventBus,
=======
    eventBus
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
  );

  const refreshToken = new RefreshTokenUseCase(
    userRepository,
    tokenRepository,
    tokenGenerator,
<<<<<<< HEAD
    logger,
=======
    logger
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
  );

  const logoutUser = new LogoutUser(tokenRepository, logger);
  const logoutAllDevices = new LogoutAllDevices(tokenRepository, logger);

<<<<<<< HEAD
  const verifyEmail = new VerifyEmail(userRepository, tokenGenerator, eventBus, logger);

  const changePassword = new ChangePassword(userRepository, passwordHasher, eventBus, logger);
=======
  const verifyEmail = new VerifyEmail(
    userRepository,
    tokenGenerator,
    eventBus,
    logger
  );

  const changePassword = new ChangePassword(
    userRepository,
    passwordHasher,
    eventBus,
    logger
  );
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e

  // 7. Middlewares
  const jwtMiddleware = createJwtAuthMiddleware(tokenGenerator);
  const requireRoles = (...roles: string[]) => createRolesMiddleware(roles);

  // 8. Build Router
  const router = buildAuthRouter({
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllDevices,
    changePassword,
    verifyEmail,
    jwtMiddleware,
  });

  return {
    router,
    jwtMiddleware,
    requireRoles,
    useCases: {
      registerUser,
      loginUser,
      refreshToken,
      logoutUser,
      logoutAllDevices,
      verifyEmail,
      changePassword,
    },
    repositories: {
      userRepository,
      tokenRepository,
    },
    services: {
      passwordHasher,
      tokenGenerator,
      cache,
      emailSender,
    },
  };
}
