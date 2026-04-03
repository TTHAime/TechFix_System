import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeCategory = { id: 1, name: 'Laptop' };
const fakeCategory2 = { id: 2, name: 'Monitor' };

const createDto = { name: 'Laptop' };
const updateDto = { name: 'Laptop Pro' };
const actorId = 99;

const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('EquipmentCategoriesService', () => {
  let service: EquipmentCategoriesService;

  const mockPrisma = {
    equipmentCategory: {
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
        EquipmentCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<EquipmentCategoriesService>(
      EquipmentCategoriesService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return the created category when input is valid', async () => {
      mockPrisma.equipmentCategory.create.mockResolvedValue(fakeCategory);

      const result = await service.create(createDto, actorId);

      expect(result).toEqual(fakeCategory);
    });

    it('should call auditLogsService.create after successful creation', async () => {
      mockPrisma.equipmentCategory.create.mockResolvedValue(fakeCategory);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'equipment_category',
          entityId: fakeCategory.id,
          action: 'created',
          newValue: fakeCategory,
        }),
      );
    });

    it('should log the creation', async () => {
      mockPrisma.equipmentCategory.create.mockResolvedValue(fakeCategory);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.create(createDto, actorId);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('created'),
      );
    });

    it('should throw ConflictException when category name is duplicate (P2002)', async () => {
      mockPrisma.equipmentCategory.create.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.equipmentCategory.create.mockRejectedValue(
        new Error('DB connection lost'),
      );
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the category when id exists', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeCategory);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([
        fakeCategory,
        fakeCategory2,
      ]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeCategory, fakeCategory2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([fakeCategory]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.equipmentCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.equipmentCategory.findMany.mockResolvedValue([]);
      mockPrisma.equipmentCategory.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.equipmentCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('update', () => {
    it('should return the updated category when input is valid', async () => {
      const updatedCategory = { ...fakeCategory, name: updateDto.name };
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.update.mockResolvedValue(updatedCategory);

      const result = await service.update(1, updateDto, actorId);

      expect(result).toEqual(updatedCategory);
    });

    it('should call auditLogsService.create with old and new values after update', async () => {
      const updatedCategory = { ...fakeCategory, name: updateDto.name };
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.update.mockResolvedValue(updatedCategory);

      await service.update(1, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'equipment_category',
          entityId: 1,
          action: 'updated',
          oldValue: fakeCategory,
          newValue: updatedCategory,
        }),
      );
    });

    it('should throw NotFoundException when category does not exist (P2025)', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when category name is duplicate (P2002)', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.update.mockRejectedValue(
        new Error('DB connection lost'),
      );
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should return the deleted category when id exists', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.delete.mockResolvedValue(fakeCategory);

      const result = await service.remove(1, actorId);

      expect(result).toEqual(fakeCategory);
    });

    it('should call auditLogsService.create with action deleted after removal', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.delete.mockResolvedValue(fakeCategory);

      await service.remove(1, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'equipment_category',
          entityId: 1,
          action: 'deleted',
          oldValue: fakeCategory,
        }),
      );
    });

    it('should throw NotFoundException when category does not exist (P2025)', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when category still has equipment assigned (P2003)', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        makePrismaError('P2003'),
      );

      await expect(service.remove(1, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.equipmentCategory.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.equipmentCategory.delete.mockRejectedValue(
        new Error('DB connection lost'),
      );
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.remove(1, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
