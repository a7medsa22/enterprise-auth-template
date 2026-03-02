import { IRateLimiter } from "@auth-template/core/application/ports/IRateLimiter";
import { NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from 'express';
export class RateLimitMiddleware implements NestMiddleware {

    constructor(private readonly rateLimiter: IRateLimiter) { }

    async use(req: Request, res: Response, next: NextFunction) {

        const key = `rate-limit:${req.ip}`;

        const result = await this.rateLimiter.check(key, {
            maxAttempts: 100,
            windowMs: 60000, // 1 minute
        });
        // handle limiter infrastructure failure only
        if (result.isFailure) return next();

        const rateLimitResult = result.getValue();

        res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());

        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                statusCode: 429,
                message: 'Too many requests. Please try again later.',
                retryAfter: rateLimitResult.resetAt,
            });
        }
        next();
    }
}