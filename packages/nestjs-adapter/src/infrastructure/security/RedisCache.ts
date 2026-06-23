import { Result } from '@auth-template/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import { Redis } from 'ioredis';
import { ICacheProvider, CacheOptions } from '@auth-template/core/application';
@Injectable()
export class RedisCache implements ICacheProvider {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<Result<T | null>> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return Result.ok(null);
      }
      const parsed = JSON.parse(value) as T;
      return Result.ok(parsed);
    } catch (error) {
      return Result.fail(`Failed to get cache: ${error}`);
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<Result<void>> {
    try {
      const serialized = JSON.stringify(value);
      if (options?.ttl) {
        await this.redis.setex(key, options.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to set cache: ${error}`);
    }
  }

  async delete(key: string): Promise<Result<void>> {
    try {
      await this.redis.del(key);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete cache: ${error}`);
    }
  }

  async deletePattern(pattern: string): Promise<Result<number>> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        return Result.ok(deleted);
      }
      return Result.ok(0);
    } catch (error) {
      return Result.fail(`Failed to delete pattern: ${error}`);
    }
  }

  async exists(key: string): Promise<Result<boolean>> {
    try {
      const exists = await this.redis.exists(key);
      return Result.ok(exists === 1);
    } catch (error) {
      return Result.fail(`Failed to check existence: ${error}`);
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      await this.redis.flushdb();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear cache: ${error}`);
    }
  }
}
