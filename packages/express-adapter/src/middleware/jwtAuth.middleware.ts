import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ITokenGenerator } from '@auth-template/core/application';

export function createJwtAuthMiddleware(tokenGenerator: ITokenGenerator): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ message: 'Authorization header is missing' });
        return;
      }

      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        res.status(401).json({ message: 'Invalid authorization format. Expected Bearer <token>' });
        return;
      }

      const result = await tokenGenerator.verifyAccessToken(token);
      if (result.isFailure) {
        res.status(401).json({ message: result.error || 'Invalid or expired token' });
        return;
      }

      req.user = result.getValue();
      next();
    } catch {
      res.status(401).json({ message: 'Authentication failed' });
    }
  };
}
