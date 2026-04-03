import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestStatusDto } from './dto/create-request-status.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class RequestStatusService {
  private readonly logger = new Logger(RequestStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createRequestStatusDto: CreateRequestStatusDto,
    actorId: number,
  ) {
    try {
      const status = await this.prisma.requestStatus.create({
        data: createRequestStatusDto,
      });
      this.logger.log(
        `Request status created: ${status.id} by actor ${actorId}`,
      );
      await this.auditLogsService.create({
        actorId,
        entityType: 'request_status',
        entityId: status.id,
        action: 'created',
        newValue: status,
      });
      return status;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Request status name already exists');
      }
      this.logger.error(
        `Failed to create request status`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.requestStatus.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.requestStatus.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const status = await this.prisma.requestStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`Request status #${id} not found`);
    }

    return status;
  }

  async update(
    id: number,
    updateRequestStatusDto: UpdateRequestStatusDto,
    actorId: number,
  ) {
    const oldStatus = await this.findOne(id);
    try {
      const status = await this.prisma.requestStatus.update({
        where: { id },
        data: updateRequestStatusDto,
      });
      this.logger.log(`Request status updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'request_status',
        entityId: id,
        action: 'updated',
        oldValue: oldStatus,
        newValue: status,
      });
      return status;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Request status #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Request status name already exists');
      }
      this.logger.error(
        `Failed to update request status ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async remove(id: number, actorId: number) {
    const oldStatus = await this.findOne(id);
    try {
      const status = await this.prisma.requestStatus.delete({
        where: { id },
      });
      this.logger.log(`Request status deleted: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'request_status',
        entityId: id,
        action: 'deleted',
        oldValue: oldStatus,
      });
      return status;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Request status #${id} not found`);
        if (e.code === 'P2003')
          throw new ConflictException(
            'Cannot delete status: it is still used by repair requests',
          );
      }
      this.logger.error(
        `Failed to delete request status ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }
}
