import { Result } from '../../shared/utils/Result';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export interface ICacheProvider {
  get<T>(key: string): Promise<Result<T | null>>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<Result<void>>;
  delete(key: string): Promise<Result<void>>;
  deletePattern(pattern: string): Promise<Result<number>>;
  exists(key: string): Promise<Result<boolean>>;
  clear(): Promise<Result<void>>;
}
