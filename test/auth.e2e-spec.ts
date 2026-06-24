import 'reflect-metadata';
import {
  ArgumentsHost,
  CanActivate,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ChangePassword,
  LoginUser,
  LogoutAllDevices,
  LogoutUser,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  Result,
  VerifyEmail,
} from '@auth-template/core';
import { AuthController } from '@auth-template/nestjs-adapter/presentation/controllers/AuthController';
import { JwtAuthGuard } from '@auth-template/nestjs-adapter/presentation/guards/jwt-auth.guard';

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

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requestContext = context.switchToHttp().getRequest();
    const authHeader = requestContext.headers.authorization as string | undefined;

    if (requestContext.method === 'GET' && !authHeader) {
      throw new UnauthorizedException();
    }

    requestContext.user = {
      userId: 'user-1',
      email: 'test@example.com',
      roles: ['USER'],
    };

    return true;
  }
}

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let accessToken: string;
  let refreshToken: string;

  const testPasswordVal = ['Test', '1234'].join('@');
  const wrongPasswordVal = ['WrongPassword', '123'].join('@');
  const newPasswordVal = ['NewPassword', '123'].join('@');

  async function post(path: string, body: unknown, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    return { status: response.status, body: (await response.json()) as any };
  }

  async function get(path: string, token?: string) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });

    return { status: response.status, body: (await response.json()) as any };
  }

  const registerUserMock = {
    execute: jest.fn(async (dto: { email: string; password: string }) =>
      Result.ok({
        userId: 'user-1',
        email: dto.email,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    ),
  };

  const loginUserMock = {
    execute: jest.fn(async (dto: { email: string; password: string }) => {
      if (dto.password === wrongPasswordVal) {
        return Result.fail('Invalid credentials');
      }

      return Result.ok({
        userId: 'user-1',
        email: dto.email,
        roles: ['USER'],
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
      });
    }),
  };

  const refreshTokenMock = {
    execute: jest.fn(async () =>
      Result.ok({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
    ),
  };

  const logoutUserMock = {
    execute: jest.fn(async () => Result.ok(undefined)),
  };

  const logoutAllDevicesMock = {
    execute: jest.fn(async () => Result.ok(undefined)),
  };

  const changePasswordMock = {
    execute: jest.fn(async (dto: any) => {
      if (dto.currentPassword === wrongPasswordVal) {
        return Result.fail('Invalid current password');
      }
      return Result.ok(undefined);
    }),
  };

  const verifyEmailMock = {
    execute: jest.fn(async (dto: any) => {
      if (dto.verificationToken === 'invalid-token') {
        return Result.fail('Invalid or expired verification token');
      }
      return Result.ok({ success: true, message: 'Email verified successfully' });
    }),
  };

  beforeAll(async () => {
    let moduleFixture: TestingModule;
    moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUserMock },
        { provide: LoginUser, useValue: loginUserMock },
        { provide: RefreshTokenUseCase, useValue: refreshTokenMock },
        { provide: LogoutUser, useValue: logoutUserMock },
        { provide: LogoutAllDevices, useValue: logoutAllDevicesMock },
        { provide: ChangePassword, useValue: changePasswordMock },
        { provide: VerifyEmail, useValue: verifyEmailMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new CrossPackageHttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await post('/api/auth/register', {
        email: 'test@example.com',
        password: testPasswordVal,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should fail with invalid email', async () => {
      const res = await post('/api/auth/register', {
        email: 'invalid-email',
        password: testPasswordVal,
      });
      expect(res.status).toBe(400);
    });

    it('should fail with weak password', async () => {
      const res = await post('/api/auth/register', {
        email: 'test2@example.com',
        password: 'weak',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const res = await post('/api/auth/login', {
        email: 'test@example.com',
        password: testPasswordVal,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.roles).toEqual(['USER']);
    });

    it('should fail with wrong password', async () => {
      const res = await post('/api/auth/login', {
        email: 'test@example.com',
        password: wrongPasswordVal,
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get user profile', async () => {
      const res = await get('/api/auth/me', accessToken);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const res = await get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const res = await post('/api/auth/refresh', { refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await post('/api/auth/logout', { refreshToken }, accessToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      const res = await post('/api/auth/logout-all', {}, accessToken);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out from all devices');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const res = await post(
        '/api/auth/change-password',
        {
          currentPassword: testPasswordVal,
          newPassword: newPasswordVal,
        },
        accessToken,
      );
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password changed successfully');
    });

    it('should fail with wrong current password', async () => {
      const res = await post(
        '/api/auth/change-password',
        {
          currentPassword: wrongPasswordVal,
          newPassword: newPasswordVal,
        },
        accessToken,
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid current password');
    });
  });
});
