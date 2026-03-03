import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    bcrypt: {
        rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },
    rateLimit: {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    },
}));