import { Request, Response, NextFunction, RequestHandler } from 'express';

export function createRolesMiddleware(requiredRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user || !user.roles) {
      res.status(403).json({ message: 'User roles not found' });
      return;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ message: 'Forbidden resource' });
      return;
    }

    next();
  };
}
