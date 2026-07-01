import { Router, Request, Response, RequestHandler, NextFunction } from 'express';
import {
  RegisterUserUseCase,
  LoginUser,
  RefreshTokenUseCase,
  LogoutUser,
  LogoutAllDevices,
  ChangePassword,
  VerifyEmail,
} from '@auth-template/core';
import { createValidateMiddleware } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '../validation/auth.schemas';

export interface AuthRouterDeps {
  registerUser: RegisterUserUseCase;
  loginUser: LoginUser;
  refreshToken: RefreshTokenUseCase;
  logoutUser: LogoutUser;
  logoutAllDevices: LogoutAllDevices;
  changePassword: ChangePassword;
  verifyEmail: VerifyEmail;
  jwtMiddleware: RequestHandler;
}

// Wrapper to catch async handler errors and pass to express error handler
const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();

  // POST /auth/register
  router.post(
    '/register',
    createValidateMiddleware(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await deps.registerUser.execute({
        email: req.body.email,
        password: req.body.password,
      });

      if (result.isFailure) {
        res.status(400).json({ message: result.error });
        return;
      }

      const data = result.getValue();
      res.status(201).json({
        user: {
          id: data.userId,
          email: data.email,
          roles: ['USER'],
          emailVerified: false,
          isActive: true,
          createdAt: new Date(),
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    }),
  );

  // POST /auth/verify-email
  router.post(
    '/verify-email',
    createValidateMiddleware(verifyEmailSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await deps.verifyEmail.execute({
        userId: req.body.userId,
        verificationToken: req.body.verificationToken,
      });

      if (result.isFailure) {
        res.status(400).json({ message: result.error });
        return;
      }

      res.status(200).json({ message: result.getValue().message });
    }),
  );

  // POST /auth/login
  router.post(
    '/login',
    createValidateMiddleware(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await deps.loginUser.execute({
        email: req.body.email,
        password: req.body.password,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      if (result.isFailure) {
        res.status(401).json({ message: result.error });
        return;
      }

      const data = result.getValue();
      res.status(200).json({
        user: {
          id: data.userId,
          email: data.email,
          roles: data.roles,
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    }),
  );

  // POST /auth/refresh
  router.post(
    '/refresh',
    createValidateMiddleware(refreshTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await deps.refreshToken.execute({
        refreshToken: req.body.refreshToken,
      });

      if (result.isFailure) {
        res.status(401).json({ message: result.error });
        return;
      }

      res.status(200).json(result.getValue());
    }),
  );

  // POST /auth/logout
  router.post(
    '/logout',
    deps.jwtMiddleware,
    createValidateMiddleware(refreshTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'User identifier not found in request' });
        return;
      }

      const result = await deps.logoutUser.execute({
        userId,
        refreshToken: req.body.refreshToken,
      });

      if (result.isFailure) {
        res.status(400).json({ message: result.error });
        return;
      }

      res.status(200).json({ message: 'Logged out successfully' });
    }),
  );

  // POST /auth/logout-all
  router.post(
    '/logout-all',
    deps.jwtMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'User identifier not found in request' });
        return;
      }

      const result = await deps.logoutAllDevices.execute({ userId });

      if (result.isFailure) {
        res.status(400).json({ message: result.error });
        return;
      }

      res.status(200).json({ message: 'Logged out from all devices' });
    }),
  );

  // POST /auth/change-password
  router.post(
    '/change-password',
    deps.jwtMiddleware,
    createValidateMiddleware(changePasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'User identifier not found in request' });
        return;
      }

      const result = await deps.changePassword.execute({
        userId,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      });

      if (result.isFailure) {
        res.status(400).json({ message: result.error });
        return;
      }

      res.status(200).json({ message: 'Password changed successfully' });
    }),
  );

  // GET /auth/me
  router.get(
    '/me',
    deps.jwtMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      res.status(200).json(req.user);
    }),
  );

  return router;
}
