import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
<<<<<<< HEAD
  _next: NextFunction,
=======
  next: NextFunction
>>>>>>> 3e614b89a5fc6f69382ca66452716f838e414f9e
): void => {
  console.error(err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    message,
    errors: err.errors || undefined,
  });
};
