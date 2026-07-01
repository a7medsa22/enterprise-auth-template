import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { z } from 'zod';
import { Result } from '@auth-template/core';
import { createValidateMiddleware } from '../middleware/validate.middleware';
import { createRolesMiddleware } from '../middleware/roles.middleware';
import { createJwtAuthMiddleware } from '../middleware/jwtAuth.middleware';
import { createAuthRouter } from '../router/authRouter';

describe('Express Adapter Test Suite', () => {
  // ==========================================
  // 1. Validation Middleware Tests
  // ==========================================
  describe('Validation Middleware', () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().positive(),
    });

    const app = express();
    app.use(express.json());
    app.post('/test-val', createValidateMiddleware(schema), (req, res) => {
      res.status(200).json({ body: req.body });
    });

    it('should return 200 and sanitised body when valid data is passed', async () => {
      const response = await request(app).post('/test-val').send({ name: 'Ahmed', age: 30 });

      expect(response.status).toBe(200);
      expect(response.body.body).toEqual({ name: 'Ahmed', age: 30 });
    });

    it('should return 400 validation error when invalid data is passed', async () => {
      const response = await request(app).post('/test-val').send({ name: 'Ah', age: -5 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors).toHaveLength(2);
    });
  });

  // ==========================================
  // 2. Roles Middleware Tests
  // ==========================================
  describe('Roles Authorization Middleware', () => {
    const app = express();
    app.use((req: any, res, next) => {
      req.user = { userId: '123', email: 'a@a.com', roles: ['USER'] };
      next();
    });

    app.get('/admin-only', createRolesMiddleware(['ADMIN']), (req, res) => {
      res.status(200).json({ success: true });
    });

    app.get('/user-only', createRolesMiddleware(['USER']), (req, res) => {
      res.status(200).json({ success: true });
    });

    it('should return 403 Forbidden if user does not have required role', async () => {
      const response = await request(app).get('/admin-only');
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Forbidden resource');
    });

    it('should return 200 OK if user has required role', async () => {
      const response = await request(app).get('/user-only');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  // ==========================================
  // 3. JWT Authentication Middleware Tests
  // ==========================================
  describe('JWT Authentication Middleware', () => {
    let mockTokenGenerator: any;
    let app: express.Express;

    beforeEach(() => {
      mockTokenGenerator = {
        verifyAccessToken: jest.fn(),
        generateAccessToken: jest.fn(),
        generateRefreshToken: jest.fn(),
        verifyRefreshToken: jest.fn(),
        getAccessTokenExpiration: () => 900,
        getRefreshTokenExpiration: () => 604800,
      };

      app = express();
      app.get(
        '/protected',
        createJwtAuthMiddleware(mockTokenGenerator),
        (req: Request, res: Response) => {
          res.status(200).json({ user: req.user });
        },
      );
    });

    it('should return 401 if Authorization header is missing', async () => {
      const response = await request(app).get('/protected');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authorization header is missing');
    });

    it('should return 401 if Authorization format is invalid', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token123');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid authorization format. Expected Bearer <token>',
      );
    });

    it('should return 401 if token verification fails', async () => {
      mockTokenGenerator.verifyAccessToken.mockResolvedValue(Result.fail('Token is expired'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Token is expired');
    });

    it('should populate req.user and return 200 if token verification is successful', async () => {
      const userPayload = { userId: 'usr_1', email: 'test@example.com', roles: ['USER'] };
      mockTokenGenerator.verifyAccessToken.mockResolvedValue(Result.ok(userPayload));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(userPayload);
    });
  });

  // ==========================================
  // 4. Router Integration Tests
  // ==========================================
  describe('Router Mappings', () => {
    let mockDeps: any;
    let app: express.Express;

    beforeEach(() => {
      mockDeps = {
        registerUser: { execute: jest.fn() },
        loginUser: { execute: jest.fn() },
        refreshToken: { execute: jest.fn() },
        logoutUser: { execute: jest.fn() },
        logoutAllDevices: { execute: jest.fn() },
        changePassword: { execute: jest.fn() },
        verifyEmail: { execute: jest.fn() },
        jwtMiddleware: (req: any, res: Response, next: NextFunction) => {
          req.user = { userId: 'usr_123', email: 'user@example.com', roles: ['USER'] };
          next();
        },
      };

      const router = createAuthRouter(mockDeps);
      app = express();
      app.use(express.json());
      app.use('/auth', router);
    });

    it('POST /auth/register - should map success response', async () => {
      mockDeps.registerUser.execute.mockResolvedValue(
        Result.ok({
          userId: 'usr_123',
          email: 'user@example.com',
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
        }),
      );

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'Password@123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken', 'access_token_123');
      expect(response.body.user).toHaveProperty('id', 'usr_123');
    });

    it('POST /auth/register - should map failure response', async () => {
      mockDeps.registerUser.execute.mockResolvedValue(Result.fail('Email already exists'));

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'user@example.com', password: 'Password@123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('GET /auth/me - should return logged-in profile data', async () => {
      const response = await request(app).get('/auth/me');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userId: 'usr_123',
        email: 'user@example.com',
        roles: ['USER'],
      });
    });
  });
});
