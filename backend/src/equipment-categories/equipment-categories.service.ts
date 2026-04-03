import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class EquipmentCategoriesService {
  private readonly logger = new Logger(EquipmentCategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createEquipmentCategoryDto: CreateEquipmentCategoryDto,
    actorId: number,
  ) {
    try {
      const category = await this.prisma.equipmentCategory.create({
        data: { ...createEquipmentCategoryDto },
      });
      this.logger.log(
        `Equipment category created: ${category.id} by actor ${actorId}`,
      );
      await this.auditLogsService.create({
        actorId,
        entityType: 'equipment_category',
        entityId: category.id,
        action: 'created',
        newValue: category,
      });
      return category;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Equipment category name already exists');
      }
      this.logger.error(
        `Failed to create equipment category`,
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
      this.prisma.equipmentCategory.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.equipmentCategory.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Equipment category #${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateEquipmentCategoryDto: UpdateEquipmentCategoryDto,
    actorId: number,
  ) {
    const oldCategory = await this.findOne(id);
    try {
      const category = await this.prisma.equipmentCategory.update({
        where: { id },
        data: updateEquipmentCategoryDto,
      });
      this.logger.log(`Equipment category updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'equipment_category',
        entityId: id,
        action: 'updated',
        oldValue: oldCategory,
        newValue: category,
      });
      return category;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment category #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Equipment category name already exists');
      }
      this.logger.error(
        `Failed to update equipment category ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async remove(id: number, actorId: number) {
    const oldCategory = await this.findOne(id);
    try {
      const category = await this.prisma.equipmentCategory.delete({
        where: { id },
      });
      this.logger.log(`Equipment category deleted: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'equipment_category',
        entityId: id,
        action: 'deleted',
        oldValue: oldCategory,
      });
      return category;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment category #${id} not found`);
        if (e.code === 'P2003')
          throw new ConflictException(
            'Cannot delete category: it still has equipment assigned',
          );
      }
      this.logger.error(
        `Failed to delete equipment category ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }
}
