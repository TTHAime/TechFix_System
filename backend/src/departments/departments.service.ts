import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, actorId: number) {
    try {
      const department = await this.prisma.department.create({
        data: createDepartmentDto,
      });
      this.logger.log(
        `Department created: ${department.id} by actor ${actorId}`,
      );
      await this.auditLogsService.create({
        actorId,
        entityType: 'department',
        entityId: department.id,
        action: 'created',
        newValue: department,
      });
      return department;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Department name already exists');
      }
      this.logger.error(
        `Failed to create department`,
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
      this.prisma.department.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.department.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department #${id} not found`);
    }
    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
    actorId: number,
  ) {
    const oldDepartment = await this.findOne(id);
    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
      });
      this.logger.log(`Department updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'department',
        entityId: id,
        action: 'updated',
        oldValue: oldDepartment,
        newValue: department,
      });
      return department;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException(`Department #${id} not found`);
        if (error.code === 'P2002')
          throw new ConflictException('Department name already exists');
      }
      this.logger.error(
        `Failed to update department ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async remove(id: number, actorId: number) {
    const oldDepartment = await this.findOne(id);
    try {
      const result = await this.prisma.department.delete({ where: { id } });
      this.logger.log(`Department deleted: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'department',
        entityId: id,
        action: 'deleted',
        oldValue: oldDepartment,
      });
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException(`Department #${id} not found`);
        if (error.code === 'P2003')
          throw new ConflictException(
            'Cannot delete department: it still has users or equipment',
          );
      }
      this.logger.error(
        `Failed to delete department ${id}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
