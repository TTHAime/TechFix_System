import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeCategory = { id: 1, name: 'Laptop' };
const fakeDepartment = { id: 2, name: 'IT' };

const fakeEquipment = {
  id: 10,
  name: 'ThinkPad X1',
  serialNo: 'SN-0001',
  categoryId: fakeCategory.id,
  deptId: fakeDepartment.id,
  isActive: true,
  category: fakeCategory,
  department: fakeDepartment,
};

const fakeEquipment2 = {
  id: 11,
  name: 'Dell Monitor',
  serialNo: 'SN-0002',
  categoryId: fakeCategory.id,
  deptId: fakeDepartment.id,
  category: fakeCategory,
  department: fakeDepartment,
};

const createDto = {
  name: 'ThinkPad X1',
  serialNo: 'SN-0001',
  categoryId: 1,
  deptId: 2,
};

const updateDto = { name: 'ThinkPad X1 Carbon' };

const paginationQuery = { page: 1, limit: 20 };

const actorId = 99;

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockPrisma = {
    equipment: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuditLogs = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return the created equipment when input is valid', async () => {
      mockPrisma.equipment.create.mockResolvedValue(fakeEquipment);
      const result = await service.create(createDto, actorId);
      expect(result).toEqual(fakeEquipment);
    });

    it('should call auditLogsService.create with correct payload when equipment is created', async () => {
      mockPrisma.equipment.create.mockResolvedValue(fakeEquipment);
      mockAuditLogs.create.mockResolvedValue(undefined);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith({
        actorId,
        entityType: 'equipment',
        entityId: fakeEquipment.id,
        action: 'created',
        newValue: fakeEquipment,
      });
    });

    it('should throw ConflictException when serial number is duplicate (P2002)', async () => {
      mockPrisma.equipment.create.mockRejectedValue(makePrismaError('P2002'));
      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when categoryId or deptId is invalid (P2003)', async () => {
      mockPrisma.equipment.create.mockRejectedValue(makePrismaError('P2003'));
      await expect(service.create(createDto, actorId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should re-throw unexpected errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.equipment.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('findOne', () => {
    it('should return equipment when id exists', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      const result = await service.findOne(fakeEquipment.id);
      expect(result).toEqual(fakeEquipment);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([
        fakeEquipment,
        fakeEquipment2,
      ]);
      mockPrisma.equipment.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeEquipment, fakeEquipment2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([fakeEquipment]);
      mockPrisma.equipment.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);
      mockPrisma.equipment.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('update', () => {
    it('should return the updated equipment when input is valid', async () => {
      const updatedEquipment = { ...fakeEquipment, name: updateDto.name };
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockResolvedValue(updatedEquipment);

      const result = await service.update(fakeEquipment.id, updateDto, actorId);

      expect(result).toEqual(updatedEquipment);
    });

    it('should call auditLogsService.create with correct payload when equipment is updated', async () => {
      const updatedEquipment = { ...fakeEquipment, name: updateDto.name };
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockResolvedValue(updatedEquipment);
      mockAuditLogs.create.mockResolvedValue(undefined);

      await service.update(fakeEquipment.id, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith({
        actorId,
        entityType: 'equipment',
        entityId: fakeEquipment.id,
        action: 'updated',
        oldValue: fakeEquipment,
        newValue: updatedEquipment,
      });
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when serial number is duplicate (P2002)', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(
        service.update(fakeEquipment.id, updateDto, actorId),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw unexpected errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(
        service.update(fakeEquipment.id, updateDto, actorId),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('delete (soft delete)', () => {
    const deactivatedEquipment = { ...fakeEquipment, isActive: false };

    it('should soft-delete equipment by setting isActive to false', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockResolvedValue(deactivatedEquipment);

      const result = await service.remove(fakeEquipment.id, actorId);

      expect(result).toEqual(deactivatedEquipment);
      expect(mockPrisma.equipment.update).toHaveBeenCalledWith({
        where: { id: fakeEquipment.id },
        data: { isActive: false },
        include: { department: true, category: true },
      });
    });

    it('should call auditLogsService.create with correct payload when equipment is soft-deleted', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(fakeEquipment);
      mockPrisma.equipment.update.mockResolvedValue(deactivatedEquipment);
      mockAuditLogs.create.mockResolvedValue(undefined);

      await service.remove(fakeEquipment.id, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith({
        actorId,
        entityType: 'equipment',
        entityId: fakeEquipment.id,
        action: 'deleted',
        oldValue: fakeEquipment,
        newValue: deactivatedEquipment,
      });
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when equipment is already deactivated', async () => {
      mockPrisma.equipment.findUnique.mockResolvedValue(deactivatedEquipment);

      await expect(service.remove(fakeEquipment.id, actorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
