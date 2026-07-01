import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
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
