import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
  const useSsl =
    process.env.DB_SSL === 'true' ||
    (dbUrl ? dbUrl.includes('sslmode=') || dbUrl.includes('neon.tech') : false);

  const sslOption = useSsl ? { rejectUnauthorized: false } : false;

  if (dbUrl) {
    return {
      type: 'postgres' as const,
      url: dbUrl,
      ssl: sslOption,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '50', 10),
        min: parseInt(process.env.DB_POOL_MIN || '10', 10),
      },
    };
  }

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth_db',
    ssl: sslOption,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '50', 10),
      min: parseInt(process.env.DB_POOL_MIN || '10', 10),
    },
  };
});
