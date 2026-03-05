import 'reflect-metadata';
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
process.env.JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
process.env.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../apps/demo/src/app.module';

describe('Auth E2E Tests', () => {
    let app: INestApplication;
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        let moduleFixture: TestingModule;
        try {
            moduleFixture = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('TestingModule compile error:', e);
            throw e;
        }

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register new user', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Test@1234',
                })
                .expect(201)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('user');
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                    accessToken = res.body.accessToken;
                    refreshToken = res.body.refreshToken;
                });
        });

        it('should fail with invalid email', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Test@1234',
                })
                .expect(400);
        });

        it('should fail with weak password', () => {
            return request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'test2@example.com',
                    password: 'weak',
                })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test@1234',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                });
        });

        it('should fail with wrong password', () => {
            return request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword@123',
                })
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get user profile', () => {
            return request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('email');
                    expect(res.body.email).toBe('test@example.com');
                });
        });

        it('should fail without token', () => {
            return request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh tokens', () => {
            return request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                });
        });
    });
});
