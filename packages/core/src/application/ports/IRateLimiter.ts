import { Result } from '../../shared/utils/Result';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after exceeding limit
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface IRateLimiter {
  check(key: string, config: RateLimitConfig): Promise<Result<RateLimitResult>>;
  reset(key: string): Promise<Result<void>>;
}
