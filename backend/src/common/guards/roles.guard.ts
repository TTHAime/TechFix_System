import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import type { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();

    if (!user?.roleName) {
      this.logger.warn(`Access denied: no role — required=[${requiredRoles}]`);
      return false;
    }

    const allowed = requiredRoles.includes(user.roleName as Role);
    if (!allowed) {
      this.logger.warn(
        `Access denied: user=${user.sub} role=${user.roleName} required=[${requiredRoles}]`,
      );
    }
    return allowed;
  }
}
