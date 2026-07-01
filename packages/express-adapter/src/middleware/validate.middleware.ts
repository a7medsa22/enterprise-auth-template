import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

export function createValidateMiddleware(schema: ZodSchema): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      // Replace req.body with verified/sanitized value
      req.body = validated;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      res.status(400).json({ message: 'Validation error', error: String(error) });
    }
  };
}
