import type { Params } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function getLoggerConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),

      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const existing = req.headers['x-request-id'];
        if (existing) return existing;
        const id = randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },

      ...(isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
          }),

      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
      },

      serializers: {
        req: (req: {
          id: string;
          method: string;
          url: string;
          headers: Record<string, string>;
        }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          ...(isProduction ? {} : { headers: req.headers }),
        }),
        res: (res: { statusCode: number }) => ({
          statusCode: res.statusCode,
        }),
      },

      customLogLevel: (
        _req: IncomingMessage,
        res: ServerResponse,
        err?: Error,
      ) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },

      autoLogging: {
        ignore: (req: IncomingMessage) =>
          req.url === '/health' || req.url === '/api/health',
      },
    },
  };
}
