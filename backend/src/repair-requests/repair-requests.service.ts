import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/role.enum';

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
        include: {
          requester: { omit: { passwordHash: true } },
          status: true,
          requestEquipment: { include: { equipment: true } },
        },
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
    return [Role.Admin, Role.Technician].includes(userRole as Role);
  }

  async findAll(userId: number, userRole: string) {
    return this.prisma.repairRequest.findMany({
      where: this.isPrivileged(userRole) ? undefined : { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { omit: { passwordHash: true } },
        status: true,
        requestEquipment: { include: { equipment: true } },
      },
    });
  }

  private async findRequest(id: number) {
    const request = await this.prisma.repairRequest.findUnique({
      where: { id },
      include: {
        requester: { omit: { passwordHash: true } },
        status: true,
        requestEquipment: { include: { equipment: true } },
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
        include: {
          requester: { omit: { passwordHash: true } },
          status: true,
          requestEquipment: { include: { equipment: true } },
        },
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
}
