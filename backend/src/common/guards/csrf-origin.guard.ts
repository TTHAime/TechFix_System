import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly logger = new Logger(CsrfOriginGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const origin = req.headers['origin'] ?? req.headers['referer'];

    if (!origin) {
      throw new ForbiddenException('Missing origin header');
    }

    const allowed = (
      process.env.CORS_ORIGIN ?? 'http://localhost:5173'
    ).split(',');

    const isAllowed = allowed.some((o) => origin.startsWith(o.trim()));

    if (!isAllowed) {
      this.logger.warn(`CSRF blocked: origin=${origin}`);
      throw new ForbiddenException('Invalid origin');
    }

    return true;
  }
}
