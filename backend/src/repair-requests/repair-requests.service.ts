import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { ResolveItemDto } from './dto/resolve-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { Role } from 'src/common/enums/role.enum';
import type { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

const ITEM_INCLUDE = {
  equipment: { include: { category: true, department: true } },
  status: true,
  technician: { omit: { passwordHash: true } },
} as const;

const REPAIR_REQUEST_INCLUDE = {
  requester: {
    omit: { passwordHash: true },
    include: { role: true, department: true },
  },
  status: true,
  requestEquipment: {
    include: ITEM_INCLUDE,
    orderBy: { seqNo: 'asc' as const },
  },
  assignmentLogs: {
    orderBy: { loggedAt: 'desc' as const },
    include: {
      technician: { omit: { passwordHash: true } },
      actor: { omit: { passwordHash: true } },
      item: true,
    },
  },
} as const;

@Injectable()
export class RepairRequestsService {
  private readonly logger = new Logger(RepairRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getStatusByName(name: string) {
    const status = await this.prisma.requestStatus.findFirst({
      where: { name },
    });
    if (!status)
      throw new NotFoundException(`Request status '${name}' not found`);
    return status;
  }

  async create(
    createRepairRequestDto: CreateRepairRequestDto,
    requesterId: number,
  ) {
    const openStatus = await this.getStatusByName('open');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const request = await tx.repairRequest.create({
          data: {
            requesterId,
            statusId: openStatus.id,
            description: createRepairRequestDto.description,
            requestEquipment: {
              create: createRepairRequestDto.equipments.map((e, idx) => ({
                seqNo: idx + 1,
                equipmentId: e.equipmentId,
                issueDetail: e.issueDetail,
                statusId: openStatus.id,
              })),
            },
          },
          include: REPAIR_REQUEST_INCLUDE,
        });

        await tx.statusLog.create({
          data: {
            requestId: request.id,
            changedBy: requesterId,
            oldStatusId: openStatus.id,
            newStatusId: openStatus.id,
            note: 'Request created',
          },
        });

        this.logger.log(
          `Repair request #${request.id} created by user #${requesterId}`,
        );
        return request;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Invalid equipmentId — equipment not found',
          );
        }
      }
      throw e;
    }
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

  // ─── Accept item (technician รับงานชิ้นนี้) ─────────────────────────────────
  async acceptItem(requestId: number, seqNo: number, technicianId: number) {
    const request = await this.findRequest(requestId);

    if (request.status.name === 'closed') {
      throw new BadRequestException('Cannot accept items on a closed request');
    }

    const item = request.requestEquipment.find((i) => i.seqNo === seqNo);
    if (!item) {
      throw new NotFoundException(
        `Item seq#${seqNo} not found in request #${requestId}`,
      );
    }

    if (item.status.name !== 'open') {
      throw new BadRequestException('Item is already accepted or resolved');
    }

    const inProgressStatus = await this.getStatusByName('in_progress');

    return await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.requestEquipment.update({
        where: { requestId_seqNo: { requestId, seqNo } },
        data: {
          statusId: inProgressStatus.id,
          technicianId,
        },
        include: ITEM_INCLUDE,
      });

      await tx.assignmentLog.create({
        data: {
          requestId,
          itemRequestId: requestId,
          itemSeqNo: seqNo,
          actorId: technicianId,
          technicianId,
          action: 'assigned',
        },
      });

      if (request.status.name === 'open') {
        await tx.repairRequest.update({
          where: { id: requestId },
          data: { statusId: inProgressStatus.id },
        });
        await tx.statusLog.create({
          data: {
            requestId,
            changedBy: technicianId,
            oldStatusId: request.statusId,
            newStatusId: inProgressStatus.id,
            note: `Item seq#${seqNo} accepted — request moved to in_progress`,
          },
        });
      }

      this.logger.log(
        `Item seq#${seqNo} accepted by technician #${technicianId}`,
      );
      return updatedItem;
    });
  }

  // ─── Admin assign item ────────────────────────────────────────────────────────
  async assignItem(
    requestId: number,
    seqNo: number,
    technicianId: number,
    actorId: number,
  ) {
    const request = await this.findRequest(requestId);

    if (request.status.name === 'closed') {
      throw new BadRequestException('Cannot assign items on a closed request');
    }

    const item = request.requestEquipment.find((i) => i.seqNo === seqNo);
    if (!item) {
      throw new NotFoundException(
        `Item seq#${seqNo} not found in request #${requestId}`,
      );
    }

    if (item.status.name !== 'open') {
      throw new BadRequestException('Item is already accepted or resolved');
    }

    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });
    if (!technician || (technician.role.name as Role) !== Role.Technician) {
      throw new BadRequestException('User is not a technician');
    }

    const inProgressStatus = await this.getStatusByName('in_progress');

    return await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.requestEquipment.update({
        where: { requestId_seqNo: { requestId, seqNo } },
        data: {
          statusId: inProgressStatus.id,
          technicianId,
        },
        include: ITEM_INCLUDE,
      });

      await tx.assignmentLog.create({
        data: {
          requestId,
          itemRequestId: requestId,
          itemSeqNo: seqNo,
          actorId,
          technicianId,
          action: 'assigned',
        },
      });

      if (request.status.name === 'open') {
        await tx.repairRequest.update({
          where: { id: requestId },
          data: { statusId: inProgressStatus.id },
        });
        await tx.statusLog.create({
          data: {
            requestId,
            changedBy: actorId,
            oldStatusId: request.statusId,
            newStatusId: inProgressStatus.id,
            note: `Item seq#${seqNo} assigned to technician #${technicianId}`,
          },
        });
      }

      this.logger.log(
        `Item seq#${seqNo} assigned to technician #${technicianId} by actor #${actorId}`,
      );
      return updatedItem;
    });
  }

  // ─── Unassign item (admin only) ───────────────────────────────────────────────
  async unassignItem(requestId: number, seqNo: number, actorId: number) {
    const request = await this.findRequest(requestId);
    const item = request.requestEquipment.find((i) => i.seqNo === seqNo);
    if (!item) {
      throw new NotFoundException(
        `Item seq#${seqNo} not found in request #${requestId}`,
      );
    }

    if (item.status.name !== 'in_progress') {
      throw new BadRequestException(
        'Can only unassign items that are in progress',
      );
    }

    const openStatus = await this.getStatusByName('open');
    const previousTechnicianId = item.technicianId;

    return await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.requestEquipment.update({
        where: { requestId_seqNo: { requestId, seqNo } },
        data: {
          statusId: openStatus.id,
          technicianId: null,
        },
        include: ITEM_INCLUDE,
      });

      await tx.assignmentLog.create({
        data: {
          requestId,
          itemRequestId: requestId,
          itemSeqNo: seqNo,
          actorId,
          technicianId: previousTechnicianId!,
          action: 'unassigned',
        },
      });

      const allItems = await tx.requestEquipment.findMany({
        where: { requestId },
      });
      const allOpen = allItems.every((i) => i.statusId === openStatus.id);
      if (allOpen && request.status.name === 'in_progress') {
        await tx.repairRequest.update({
          where: { id: requestId },
          data: { statusId: openStatus.id },
        });
        await tx.statusLog.create({
          data: {
            requestId,
            changedBy: actorId,
            oldStatusId: request.statusId,
            newStatusId: openStatus.id,
            note: `All items unassigned — request moved back to open`,
          },
        });
      }

      this.logger.log(`Item seq#${seqNo} unassigned by actor #${actorId}`);
      return updatedItem;
    });
  }

  // ─── Resolve item (technician marks their item as resolved) ──────────────────
  async resolveItem(
    requestId: number,
    seqNo: number,
    technicianId: number,
    dto: ResolveItemDto,
  ) {
    const request = await this.findRequest(requestId);
    const item = request.requestEquipment.find((i) => i.seqNo === seqNo);

    if (!item) {
      throw new NotFoundException(
        `Item seq#${seqNo} not found in request #${requestId}`,
      );
    }

    if (item.status.name !== 'in_progress') {
      throw new BadRequestException('Item must be in_progress to resolve');
    }

    if (item.technicianId !== technicianId) {
      throw new ForbiddenException(
        'You can only resolve items assigned to you',
      );
    }

    const resolvedStatus = await this.getStatusByName('resolved');

    return await this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.requestEquipment.update({
        where: { requestId_seqNo: { requestId, seqNo } },
        data: {
          statusId: resolvedStatus.id,
          resolvedAt: new Date(),
          ...(dto.partsUsed !== undefined && { partsUsed: dto.partsUsed }),
          ...(dto.repairSummary !== undefined && {
            repairSummary: dto.repairSummary,
          }),
        },
        include: ITEM_INCLUDE,
      });

      const allItems = await tx.requestEquipment.findMany({
        where: { requestId },
      });
      const allResolved = allItems.every((i) =>
        i.seqNo === seqNo ? true : i.statusId === resolvedStatus.id,
      );

      if (allResolved) {
        await tx.repairRequest.update({
          where: { id: requestId },
          data: {
            statusId: resolvedStatus.id,
            completedAt: new Date(),
          },
        });
        await tx.statusLog.create({
          data: {
            requestId,
            changedBy: technicianId,
            oldStatusId: request.statusId,
            newStatusId: resolvedStatus.id,
            note: dto.note ?? 'All items resolved',
          },
        });
        this.logger.log(
          `Request #${requestId} auto-resolved — all items resolved`,
        );
      }

      this.logger.log(
        `Item seq#${seqNo} resolved by technician #${technicianId}`,
      );
      return updatedItem;
    });
  }

  // ─── Update request-level fields (admin only) ─────────────────────────────────
  async update(
    id: number,
    updateRepairRequestDto: UpdateRepairRequestDto,
    userId: number,
    userRole?: string,
  ) {
    const request = await this.findRequest(id);

    if (
      userRole === Role.Technician &&
      updateRepairRequestDto.statusId !== undefined
    ) {
      throw new ForbiddenException(
        'Technician cannot update request status directly — use resolve item instead',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.repairRequest.update({
          where: { id },
          data: {
            ...(updateRepairRequestDto.statusId !== undefined && {
              statusId: updateRepairRequestDto.statusId,
            }),
            ...(updateRepairRequestDto.completedAt !== undefined && {
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
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException('Invalid statusId — status not found');
        }
      }
      throw e;
    }
  }

  async close(id: number, userId: number) {
    const request = await this.findRequest(id);
    const closedStatus = await this.getStatusByName('closed');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.repairRequest.update({
        where: { id },
        data: { statusId: closedStatus.id },
        include: REPAIR_REQUEST_INCLUDE,
      });
      await tx.statusLog.create({
        data: {
          requestId: id,
          changedBy: userId,
          oldStatusId: request.statusId,
          newStatusId: closedStatus.id,
          note: 'Force closed by admin',
        },
      });
      this.logger.log(`Request #${id} force-closed by admin #${userId}`);
      return updated;
    });
  }

  async confirm(id: number, userId: number) {
    const request = await this.findRequest(id);

    if (request.requesterId !== userId)
      throw new ForbiddenException(
        'Only the requester can confirm this request',
      );

    if (request.status.name !== 'resolved')
      throw new BadRequestException(
        'Request must be resolved before it can be confirmed',
      );

    const closedStatus = await this.getStatusByName('closed');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.repairRequest.update({
        where: { id },
        data: { statusId: closedStatus.id },
        include: REPAIR_REQUEST_INCLUDE,
      });
      await tx.statusLog.create({
        data: {
          requestId: id,
          changedBy: userId,
          oldStatusId: request.statusId,
          newStatusId: closedStatus.id,
          note: 'Confirmed by requester',
        },
      });
      this.logger.log(
        `Request #${id} confirmed and closed by requester #${userId}`,
      );
      return updated;
    });
  }

  async getAllAssignmentLogs(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.assignmentLog.findMany({
        skip,
        take: limit,
        orderBy: { loggedAt: 'desc' },
        include: {
          technician: { omit: { passwordHash: true } },
          actor: { omit: { passwordHash: true } },
          item: true,
        },
      }),
      this.prisma.assignmentLog.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async getAssignmentLogs(requestId: number) {
    await this.findRequest(requestId);

    return this.prisma.assignmentLog.findMany({
      where: { requestId },
      orderBy: { loggedAt: 'desc' },
      include: {
        technician: { omit: { passwordHash: true } },
        actor: { omit: { passwordHash: true } },
        item: true,
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
