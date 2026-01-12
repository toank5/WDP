import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const logger = new Logger(LoggerMiddleware.name);
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      const logMessage = `${req.method} ${req.url} ${res.statusCode} ${req.ip} ${req.httpVersion} ${duration}ms ${req.get('User-Agent')}`;
      logger.log(logMessage);
      if (req.body) {
        logger.log(JSON.stringify(req.body));
      }
    });

    next();
  }
}
