import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { BaseRedisCache } from '@auth-template/typeorm';

@Injectable()
export class RedisCache extends BaseRedisCache {
  constructor(
    @Inject('REDIS_CLIENT')
    redis: Redis,
  ) {
    super(redis);
  }
}
