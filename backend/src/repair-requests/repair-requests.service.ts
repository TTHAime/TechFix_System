import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

const REPAIR_REQUEST_INCLUDE = {
  requester: { omit: { passwordHash: true } },
  status: true,
  requestEquipment: { include: { equipment: true } },
} as const;

@Injectable()
export class RepairRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRepairRequestDto: CreateRepairRequestDto,
    requesterId: number,
  ) {
    const OPEN_STATUS_ID = 1;
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.repairRequest.create({
        data: {
          requesterId,
          statusId: OPEN_STATUS_ID,
          description: createRepairRequestDto.description,
          requestEquipment: {
            create: createRepairRequestDto.equipments.map((e) => ({
              equipmentId: e.equipmentId,
              issueDetail: e.issueDetail,
            })),
          },
        },
        include: REPAIR_REQUEST_INCLUDE,
      });

      await tx.statusLog.create({
        data: {
          requestId: request.id,
          changedBy: requesterId,
          oldStatusId: OPEN_STATUS_ID,
          newStatusId: OPEN_STATUS_ID,
          note: 'Request created',
        },
      });

      return request;
    });
  }

  private isPrivileged(userRole: string) {
    return [Role.Admin, Role.HR, Role.Technician].includes(userRole as Role);
  }

  async findAll(userId: number, userRole: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.isPrivileged(userRole)
      ? undefined
      : { requesterId: userId };

    const [data, total] = await Promise.all([
      this.prisma.repairRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: REPAIR_REQUEST_INCLUDE,
      }),
      this.prisma.repairRequest.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  private async findRequest(id: number) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
      include: {
        ...REPAIR_REQUEST_INCLUDE,
        statusLogs: { orderBy: { changedAt: 'asc' } },
      },
    });

    if (!request)
      throw new NotFoundException(`Repair request #${id} not found`);

    return request;
  }

  async findOne(id: number, userId: number, userRole: string) {
    const request = await this.findRequest(id);

    if (!this.isPrivileged(userRole) && request.requesterId !== userId)
      throw new ForbiddenException('You can only view your own requests');

    return request;
  }

  async update(
    id: number,
    updateRepairRequestDto: UpdateRepairRequestDto,
    userId: number,
  ) {
    const request = await this.findRequest(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.repairRequest.update({
        where: { id },
        data: {
          ...(updateRepairRequestDto.statusId && {
            statusId: updateRepairRequestDto.statusId,
          }),
          ...(updateRepairRequestDto.partUsed && {
            partsUsed: updateRepairRequestDto.partUsed,
          }),
          ...(updateRepairRequestDto.repairSummary && {
            repairSummary: updateRepairRequestDto.repairSummary,
          }),
          ...(updateRepairRequestDto.completedAt && {
            completedAt: updateRepairRequestDto.completedAt,
          }),
        },
        include: REPAIR_REQUEST_INCLUDE,
      });

      if (
        updateRepairRequestDto.statusId &&
        updateRepairRequestDto.statusId !== request.statusId
      ) {
        await tx.statusLog.create({
          data: {
            requestId: id,
            changedBy: userId,
            oldStatusId: request.statusId,
            newStatusId: updateRepairRequestDto.statusId,
          },
        });
      }

      return updated;
    });
  }

  async close(id: number, userId: number) {
    const CLOSED_STATUS_ID = 4;
    return this.update(id, { statusId: CLOSED_STATUS_ID }, userId);
  }

  async assignTechnician(
    requestId: number,
    technicianId: number,
    actorId: number,
  ) {
    await this.findRequest(requestId);

    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });

    if (!technician || technician.role.name !== Role.Technician) {
      throw new BadRequestException('User is not a technician');
    }

    return this.prisma.assignmentLog.create({
      data: {
        requestId,
        actorId,
        technicianId,
        action: 'assigned',
      },
      include: {
        technician: { omit: { passwordHash: true } },
        actor: { omit: { passwordHash: true } },
      },
    });
  }

  async unassignTechnician(
    requestId: number,
    technicianId: number,
    actorId: number,
  ) {
    await this.findRequest(requestId);

    return this.prisma.assignmentLog.create({
      data: {
        requestId,
        actorId,
        technicianId,
        action: 'unassigned',
      },
      include: {
        technician: { omit: { passwordHash: true } },
        actor: { omit: { passwordHash: true } },
      },
    });
  }

  async getAssignmentLogs(requestId: number) {
    await this.findRequest(requestId);

    return this.prisma.assignmentLog.findMany({
      where: { requestId },
      orderBy: { loggedAt: 'desc' },
      include: {
        technician: { omit: { passwordHash: true } },
        actor: { omit: { passwordHash: true } },
      },
    });
  }

  async getStatusLogs(requestId: number) {
    await this.findRequest(requestId);

    return this.prisma.statusLog.findMany({
      where: { requestId },
      orderBy: { changedAt: 'asc' },
      include: {
        changer: { omit: { passwordHash: true } },
        oldStatus: true,
        newStatus: true,
      },
    });
  }
}
