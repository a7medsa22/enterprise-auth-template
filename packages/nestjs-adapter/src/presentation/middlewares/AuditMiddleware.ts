import { ILogger } from '@auth-template/core/application/ports';
import { NestMiddleware } from '@nestjs/common/interfaces/middleware/nest-middleware.interface';
import { NextFunction, Request, Response } from 'express';

export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly logger: ILogger) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  }
}
