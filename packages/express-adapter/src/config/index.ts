import * as dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

export interface AuthConfig {
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiration: string;
    refreshExpiration: string;
  };
  bcrypt: {
    rounds: number;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    from: string;
  };
  frontendUrl: string;
}

export function loadConfig(overrides?: Partial<AuthConfig>): AuthConfig {
  const secureValue = process.env.SMTP_SECURE || '';
  const isSecure = secureValue === 'true' || secureValue === '1';

  const defaults: AuthConfig = {
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      secure: isSecure,
      from: process.env.SMTP_FROM || 'Auth Template <noreply@example.com>',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  };

  // Merge overrides
  if (overrides) {
    return {
      ...defaults,
      ...overrides,
      jwt: { ...defaults.jwt, ...overrides.jwt },
      bcrypt: { ...defaults.bcrypt, ...overrides.bcrypt },
      smtp: { ...defaults.smtp, ...overrides.smtp },
    };
  }

  return defaults;
}
