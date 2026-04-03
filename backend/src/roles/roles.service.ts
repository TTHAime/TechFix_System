import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createRoleDto: CreateRoleDto, actorId: number) {
    try {
      const role = await this.prisma.role.create({ data: createRoleDto });
      this.logger.log(`Role created: ${role.id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'role',
        entityId: role.id,
        action: 'created',
        newValue: role,
      });
      return role;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Role name already exists');
      }
      this.logger.error(
        `Failed to create role`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.role.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, actorId: number) {
    const oldRole = await this.findOne(id);
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });
      this.logger.log(`Role updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'role',
        entityId: id,
        action: 'updated',
        oldValue: oldRole,
        newValue: role,
      });
      return role;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException(`Role #${id} not found`);
        if (error.code === 'P2002')
          throw new ConflictException('Role name already exists');
      }
      this.logger.error(
        `Failed to update role ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async remove(id: number, actorId: number) {
    const oldRole = await this.findOne(id);
    try {
      const role = await this.prisma.role.delete({ where: { id } });
      this.logger.log(`Role deleted: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'role',
        entityId: id,
        action: 'deleted',
        oldValue: oldRole,
      });
      return role;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException(`Role #${id} not found`);
        if (error.code === 'P2003')
          throw new ConflictException(
            'Cannot delete role: it still has users assigned',
          );
      }
      this.logger.error(
        `Failed to delete role ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
