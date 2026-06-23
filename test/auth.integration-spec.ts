import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@auth-template/nestjs-adapter/presentation/typeorm/entities/UserEntity';
import { RefreshTokenEntity } from '@auth-template/nestjs-adapter/presentation/typeorm/entities/RefreshTokenEntity';
import { SessionEntity } from '@auth-template/nestjs-adapter/presentation/typeorm/entities/SessionEntity';
import { AuditLogEntity } from '@auth-template/nestjs-adapter/presentation/typeorm/entities/AuditLogEntity';
import { TypeOrmUserRepository } from '@auth-template/nestjs-adapter/presentation/typeorm/repositories/TypeOrmUserRepository';
import { TypeOrmTokenRepository } from '@auth-template/nestjs-adapter/presentation/typeorm/repositories/TypeOrmTokenRepository';
import { RedisCache } from '@auth-template/nestjs-adapter/infrastructure/security/RedisCache';
import { Redis } from 'ioredis';
import {
  User,
  UserId,
  Email,
  Password,
  Role,
  RefreshToken,
  TokenId,
  Token,
} from '@auth-template/core/domain';

describe('Database and Cache Integration Tests', () => {
  let module: TestingModule;
  let userRepo: TypeOrmUserRepository;
  let tokenRepo: TypeOrmTokenRepository;
  let redisCache: RedisCache;
  let redisClient: Redis;

  beforeAll(async () => {
    // Force NODE_ENV to test_integration
    process.env.NODE_ENV = 'test_integration';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test', '../../.env.test', '../.env.test'],
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: parseInt(configService.get('DB_PORT', '5439'), 10),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_NAME', 'auth_db_test'),
            entities: [UserEntity, RefreshTokenEntity, SessionEntity, AuditLogEntity],
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity, SessionEntity, AuditLogEntity]),
      ],
      providers: [
        TypeOrmUserRepository,
        TypeOrmTokenRepository,
        {
          provide: 'REDIS_CLIENT',
          useFactory: (configService: ConfigService) => {
            return new Redis({
              host: configService.get('REDIS_HOST', 'localhost'),
              port: parseInt(configService.get('REDIS_PORT', '6389'), 10),
            });
          },
          inject: [ConfigService],
        },
        {
          provide: 'ICacheProvider',
          useClass: RedisCache,
        },
      ],
    }).compile();

    userRepo = module.get<TypeOrmUserRepository>(TypeOrmUserRepository);
    tokenRepo = module.get<TypeOrmTokenRepository>(TypeOrmTokenRepository);
    redisCache = module.get<RedisCache>('ICacheProvider');
    redisClient = module.get<Redis>('REDIS_CLIENT');
  });

  afterAll(async () => {
    // Clear databases and close module
    if (redisClient) {
      await redisClient.flushdb().catch(() => {});
      redisClient.disconnect();
    }
    if (module) {
      await module.close();
    }
  });

  describe('TypeOrmUserRepository Integration', () => {
    const testUserId = UserId.create();
    const testEmail = Email.create('integration@example.com').getValue();
    const testPassword = Password.create({
      value: '$2b$10$abcdefghijklmnopqrstuv',
      hashed: true,
    }).getValue();

    it('should save a user to postgres and retrieve it', async () => {
      const user = User.restore({
        id: testUserId,
        email: testEmail,
        password: testPassword,
        roles: [Role.USER],
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saveResult = await userRepo.save(user);
      expect(saveResult.isSuccess).toBe(true);

      const findResult = await userRepo.findById(testUserId);
      expect(findResult.isSuccess).toBe(true);
      expect(findResult.getValue().getEmail().getValue()).toBe(testEmail.getValue());
    });

    it('should check if a user exists by email', async () => {
      const existsResult = await userRepo.exists(testEmail);
      expect(existsResult.isSuccess).toBe(true);
      expect(existsResult.getValue()).toBe(true);
    });

    it('should delete user from postgres', async () => {
      const deleteResult = await userRepo.delete(testUserId);
      expect(deleteResult.isSuccess).toBe(true);

      const findResult = await userRepo.findById(testUserId);
      expect(findResult.isFailure).toBe(true);
    });
  });

  describe('TypeOrmTokenRepository Integration', () => {
    const testUserId = UserId.create();
    const testTokenId = TokenId.create();
    const testTokenValue = Token.create('dummy-refresh-token-value-is-long-enough').getValue();
    const testExpiry = new Date(Date.now() + 3600 * 1000);

    it('should save and find refresh token', async () => {
      const token = RefreshToken.restore({
        id: testTokenId,
        userId: testUserId,
        token: testTokenValue,
        isRevoked: false,
        expiresAt: testExpiry,
        createdAt: new Date(),
      }).getValue();

      const saveRes = await tokenRepo.save(token);
      expect(saveRes.isSuccess).toBe(true);

      const findRes = await tokenRepo.findById(testTokenId);
      expect(findRes.isSuccess).toBe(true);
      expect(findRes.getValue().getToken().getValue()).toBe(testTokenValue.getValue());
    });

    it('should update and revoke a refresh token', async () => {
      const findRes = await tokenRepo.findById(testTokenId);
      const token = findRes.getValue();
      token.revoke();

      const updateRes = await tokenRepo.update(token);
      expect(updateRes.isSuccess).toBe(true);

      const reFindRes = await tokenRepo.findById(testTokenId);
      expect(reFindRes.isSuccess).toBe(true);
      expect(reFindRes.getValue().getIsRevoked()).toBe(true);
    });

    it('should delete a refresh token', async () => {
      const delRes = await tokenRepo.delete(testTokenId);
      expect(delRes.isSuccess).toBe(true);

      const findRes = await tokenRepo.findById(testTokenId);
      expect(findRes.isFailure).toBe(true);
    });
  });

  describe('RedisCache Integration', () => {
    it('should set and get a cache value in redis', async () => {
      const key = 'test-cache-key';
      const val = { ok: true, data: 'integration-test' };

      const setRes = await redisCache.set(key, val, { ttl: 60 });
      expect(setRes.isSuccess).toBe(true);

      const getRes = await redisCache.get(key);
      expect(getRes.isSuccess).toBe(true);
      expect(getRes.getValue()).toEqual(val);
    });

    it('should delete a cache value', async () => {
      const key = 'test-cache-key';
      const deleteRes = await redisCache.delete(key);
      expect(deleteRes.isSuccess).toBe(true);

      const getRes = await redisCache.get(key);
      expect(getRes.isSuccess).toBe(true);
      expect(getRes.getValue()).toBeNull();
    });
  });
});
