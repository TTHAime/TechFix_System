import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

interface JwtUser {
  sub: number;
  email: string;
  roleId: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser }>();
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { role: true },
    });

    return requiredRoles.includes(dbUser?.role.name as Role);
  }
}
