import { CacheOptions, ICacheProvider } from '@auth-template/core/application';
import { Result } from '@auth-template/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

@Injectable()
export class MemoryCache implements ICacheProvider {
  private cache = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<Result<T | null>> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return Result.ok(null);
      }

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return Result.ok(null);
      }

      return Result.ok(entry.value as T);
    } catch (error) {
      return Result.fail(`Failed to get cache: ${error}`);
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<Result<void>> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: options?.ttl ? Date.now() + options.ttl * 1000 : undefined,
      };
      this.cache.set(key, entry);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to set cache: ${error}`);
    }
  }

  async delete(key: string): Promise<Result<void>> {
    try {
      this.cache.delete(key);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete cache: ${error}`);
    }
  }

  async deletePattern(pattern: string): Promise<Result<number>> {
    try {
      const regex = new RegExp(pattern.replace('*', '.*'));
      let deleted = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deleted++;
        }
      }

      return Result.ok(deleted);
    } catch (error) {
      return Result.fail(`Failed to delete pattern: ${error}`);
    }
  }

  async exists(key: string): Promise<Result<boolean>> {
    try {
      return Result.ok(this.cache.has(key));
    } catch (error) {
      return Result.fail(`Failed to check existence: ${error}`);
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      this.cache.clear();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to clear cache: ${error}`);
    }
  }
}
