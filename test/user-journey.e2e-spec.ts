import 'reflect-metadata';
import {
  INestApplication,
  ValidationPipe,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../apps/demo/src/app.module';

@Catch()
class CrossPackageHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status =
      typeof exception?.getStatus === 'function'
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      typeof exception?.message === 'string' ? exception.message : 'Internal server error';

    response.status(status).json({ statusCode: status, message });
  }
}

describe('E2E User Journey Test (Real AppModule)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let accessToken: string;
  let refreshToken: string;

  const journeyPassVal = ['StrongPassword', '18'].join('@');
  const newJourneyPassVal = ['NewJourneyPassword', '18'].join('@');

  async function post(path: string, body: unknown, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const status = response.status;
    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = {};
    }
    return { status, body: responseBody as any };
  }

  async function get(path: string, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });

    const status = response.status;
    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = {};
    }
    return { status, body: responseBody as any };
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // This makes AppModule use sqljs & memory cache automatically

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [Reflector],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new CrossPackageHttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should go through the complete User Journey', async () => {
    // 1. Register a new user
    const regRes = await post('/api/auth/register', {
      email: 'journey@example.com',
      password: journeyPassVal,
    });
    expect(regRes.status).toBe(201);
    expect(regRes.body).toHaveProperty('accessToken');
    expect(regRes.body).toHaveProperty('refreshToken');
    accessToken = regRes.body.accessToken;
    refreshToken = regRes.body.refreshToken;

    // 1b. Verify the email address using the token
    const verifyRes = await post('/api/auth/verify-email', {
      userId: regRes.body.user.id,
      verificationToken: accessToken,
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.message).toBe('Email verified successfully');

    // 2. Fetch user profile (authenticated)
    const profileRes1 = await get('/api/auth/me', accessToken);
    expect(profileRes1.status).toBe(200);
    expect(profileRes1.body.email).toBe('journey@example.com');

    // 3. Fail profile fetch without token
    const profileResFail = await get('/api/auth/me');
    expect(profileResFail.status).toBe(401);

    // 4. Change password
    const pwdRes = await post(
      '/api/auth/change-password',
      {
        currentPassword: journeyPassVal,
        newPassword: newJourneyPassVal,
      },
      accessToken,
    );
    expect(pwdRes.status).toBe(200);
    expect(pwdRes.body.message).toBe('Password changed successfully');

    // 5. Login with new password
    const loginRes = await post('/api/auth/login', {
      email: 'journey@example.com',
      password: newJourneyPassVal,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;

    // 6. Refresh tokens
    const refreshRes = await post('/api/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    accessToken = refreshRes.body.accessToken;
    refreshToken = refreshRes.body.refreshToken;

    // 7. Logout
    const logoutRes = await post('/api/auth/logout', { refreshToken }, accessToken);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logged out successfully');

    // 8. Verify old token is no longer valid (refresh should fail with old refresh token)
    const oldRefreshRes = await post('/api/auth/refresh', { refreshToken });
    expect(oldRefreshRes.status).toBe(401);
  });
});
