import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto, actorId: number) {
    try {
      const equipment = await this.prisma.equipment.create({
        data: { ...createEquipmentDto },
        include: { department: true, category: true },
      });
      this.logger.log(`Equipment created: ${equipment.id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'equipment',
        entityId: equipment.id,
        action: 'created',
        newValue: equipment,
      });
      return equipment;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Serial number already exists');
        }
        if (e.code === 'P2003') {
          throw new BadRequestException('Invalid categoryId or deptId');
        }
      }
      this.logger.error(
        `Failed to create equipment`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: { department: true, category: true },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: { department: true, category: true },
    });

    if (!equipment) throw new NotFoundException(`Equipment #${id} not found`);

    return equipment;
  }

  async update(
    id: number,
    updateEquipmentDto: UpdateEquipmentDto,
    actorId: number,
  ) {
    const oldEquipment = await this.findOne(id);
    try {
      const equipment = await this.prisma.equipment.update({
        where: { id },
        data: { ...updateEquipmentDto },
        include: { department: true, category: true },
      });
      this.logger.log(`Equipment updated: ${id} by actor ${actorId}`);
      await this.auditLogsService.create({
        actorId,
        entityType: 'equipment',
        entityId: id,
        action: 'updated',
        oldValue: oldEquipment,
        newValue: equipment,
      });
      return equipment;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException(`Equipment #${id} not found`);
        if (e.code === 'P2002')
          throw new ConflictException('Serial number already exists');
      }
      this.logger.error(
        `Failed to update equipment ${id}`,
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }

  async remove(id: number, actorId: number) {
    const oldEquipment = await this.findOne(id);
    if (!oldEquipment.isActive) {
      throw new BadRequestException(`Equipment #${id} is already deactivated`);
    }
    const result = await this.prisma.equipment.update({
      where: { id },
      data: { isActive: false },
      include: { department: true, category: true },
    });
    this.logger.log(`Equipment soft-deleted: ${id} by actor ${actorId}`);
    await this.auditLogsService.create({
      actorId,
      entityType: 'equipment',
      entityId: id,
      action: 'deleted',
      oldValue: oldEquipment,
      newValue: result,
    });
    return result;
  }
}
