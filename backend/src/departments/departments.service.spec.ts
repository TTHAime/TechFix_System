import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeDepartment = { id: 1, name: 'IT', location: 'Building A' };
const fakeDepartment2 = { id: 2, name: 'HR', location: 'Building B' };

const createDto = { name: 'IT', location: 'Building A' };
const updateDto = { name: 'IT Updated' };
const actorId = 99;

const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockPrisma = {
    department: {
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
        DepartmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return the created department when input is valid', async () => {
      mockPrisma.department.create.mockResolvedValue(fakeDepartment);

      const result = await service.create(createDto, actorId);

      expect(result).toEqual(fakeDepartment);
    });

    it('should call auditLogsService.create with correct payload after successful creation', async () => {
      mockPrisma.department.create.mockResolvedValue(fakeDepartment);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'department',
          entityId: fakeDepartment.id,
          action: 'created',
          newValue: fakeDepartment,
        }),
      );
    });

    it('should throw ConflictException when department name is duplicate (P2002)', async () => {
      mockPrisma.department.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.department.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('findOne', () => {
    it('should return the department when id exists', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeDepartment);
    });

    it('should throw NotFoundException when department does not exist', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.department.findMany.mockResolvedValue([
        fakeDepartment,
        fakeDepartment2,
      ]);
      mockPrisma.department.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeDepartment, fakeDepartment2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.department.findMany.mockResolvedValue([fakeDepartment]);
      mockPrisma.department.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.department.findMany.mockResolvedValue([]);
      mockPrisma.department.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('update', () => {
    it('should return the updated department when input is valid', async () => {
      const updatedDepartment = { ...fakeDepartment, name: updateDto.name };
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.update.mockResolvedValue(updatedDepartment);

      const result = await service.update(1, updateDto, actorId);

      expect(result).toEqual(updatedDepartment);
    });

    it('should call auditLogsService.create with old and new values after successful update', async () => {
      const updatedDepartment = { ...fakeDepartment, name: updateDto.name };
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.update.mockResolvedValue(updatedDepartment);

      await service.update(1, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'department',
          action: 'updated',
          oldValue: fakeDepartment,
          newValue: updatedDepartment,
        }),
      );
    });

    it('should throw NotFoundException when department does not exist (P2025)', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when department name is duplicate (P2002)', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.update.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });

  describe('remove', () => {
    it('should return the deleted department when id exists', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.delete.mockResolvedValue(fakeDepartment);

      const result = await service.remove(1, actorId);

      expect(result).toEqual(fakeDepartment);
    });

    it('should call auditLogsService.create with old value after successful deletion', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.delete.mockResolvedValue(fakeDepartment);

      await service.remove(1, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'department',
          entityId: 1,
          action: 'deleted',
          oldValue: fakeDepartment,
        }),
      );
    });

    it('should throw NotFoundException when department does not exist (P2025)', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.delete.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when department still has users or equipment (P2003)', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.delete.mockRejectedValue(makePrismaError('P2003'));

      await expect(service.remove(1, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw unexpected errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(fakeDepartment);
      mockPrisma.department.delete.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.remove(1, actorId)).rejects.toThrow(
        'DB connection lost',
      );
    });
  });
});
