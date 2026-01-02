import { Inject, Injectable } from "@nestjs/common";
import { Redis } from 'ioredis';
import { TokenStorage } from "../interfaces/token-storage.interface";
@Injectable()
export class RedisTokenStorageAdapter implements TokenStorage {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

    async save(userId: string, tokenId: string, expiresIn: number): Promise<void> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        const key = this.getKey(userId, tokenId);
        const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        await this.redis.setex(key, ttl, "true");
    }
    async exists(userId: string, tokenId: string): Promise<boolean> {
        const key = this.getKey(userId, tokenId);
        return (await this.redis.exists(key)) === 1;
    }

    async revoke(userId: string, tokenId: string): Promise<void> {
        const key = this.getKey(userId, tokenId);
        await this.redis.del(key);
    }


    async revokeAll(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

     private getKey(userId: string, token: string): string {
    const tokenHash = token.substring(0, 16); // Use first 16 chars as identifier
    return `refresh_token:${userId}:${tokenHash}`;
  }


}
