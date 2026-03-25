import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { loggedAt: 'desc' },
        include: {
          actor: { omit: { passwordHash: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { loggedAt: 'desc' },
      include: {
        actor: { omit: { passwordHash: true } },
      },
    });
  }

  async create(params: {
    actorId: number;
    entityType: string;
    entityId: number;
    action: string;
    oldValue?: unknown;
    newValue?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        oldValue: params.oldValue
          ? JSON.parse(JSON.stringify(params.oldValue))
          : undefined,
        newValue: params.newValue
          ? JSON.parse(JSON.stringify(params.newValue))
          : undefined,
      },
    });
  }
}
