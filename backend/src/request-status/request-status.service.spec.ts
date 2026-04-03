import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RequestStatusService } from './request-status.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeStatus = { id: 1, name: 'Pending' };
const fakeStatus2 = { id: 2, name: 'In Progress' };

const createDto = { name: 'Pending' };
const updateDto = { name: 'Resolved' };
const actorId = 99;

const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('RequestStatusService', () => {
  let service: RequestStatusService;

  const mockPrisma = {
    requestStatus: {
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
        RequestStatusService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<RequestStatusService>(RequestStatusService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return the created status when input is valid', async () => {
      mockPrisma.requestStatus.create.mockResolvedValue(fakeStatus);

      const result = await service.create(createDto, actorId);

      expect(result).toEqual(fakeStatus);
    });

    it('should call auditLogsService.create after successful creation', async () => {
      mockPrisma.requestStatus.create.mockResolvedValue(fakeStatus);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'request_status',
          entityId: fakeStatus.id,
          action: 'created',
          newValue: fakeStatus,
        }),
      );
    });

    it('should log the creation', async () => {
      mockPrisma.requestStatus.create.mockResolvedValue(fakeStatus);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.create(createDto, actorId);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('created'),
      );
    });

    it('should throw ConflictException when status name is duplicate (P2002)', async () => {
      mockPrisma.requestStatus.create.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.requestStatus.create.mockRejectedValue(
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
    it('should return the status when id exists', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeStatus);
    });

    it('should throw NotFoundException when status does not exist', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.requestStatus.findMany.mockResolvedValue([
        fakeStatus,
        fakeStatus2,
      ]);
      mockPrisma.requestStatus.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeStatus, fakeStatus2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.requestStatus.findMany.mockResolvedValue([fakeStatus]);
      mockPrisma.requestStatus.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.requestStatus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);
      mockPrisma.requestStatus.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.requestStatus.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('update', () => {
    it('should return the updated status when input is valid', async () => {
      const updatedStatus = { ...fakeStatus, name: updateDto.name };
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.update.mockResolvedValue(updatedStatus);

      const result = await service.update(1, updateDto, actorId);

      expect(result).toEqual(updatedStatus);
    });

    it('should call auditLogsService.create with old and new values after update', async () => {
      const updatedStatus = { ...fakeStatus, name: updateDto.name };
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.update.mockResolvedValue(updatedStatus);

      await service.update(1, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'request_status',
          entityId: 1,
          action: 'updated',
          oldValue: fakeStatus,
          newValue: updatedStatus,
        }),
      );
    });

    it('should throw NotFoundException when status does not exist (P2025)', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when status name is duplicate (P2002)', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.update.mockRejectedValue(
        makePrismaError('P2002'),
      );

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.update.mockRejectedValue(
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
    it('should return the deleted status when id exists', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.delete.mockResolvedValue(fakeStatus);

      const result = await service.remove(1, actorId);

      expect(result).toEqual(fakeStatus);
    });

    it('should call auditLogsService.create with action deleted after removal', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.delete.mockResolvedValue(fakeStatus);

      await service.remove(1, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'request_status',
          entityId: 1,
          action: 'deleted',
          oldValue: fakeStatus,
        }),
      );
    });

    it('should throw NotFoundException when status does not exist (P2025)', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.delete.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when status is still used by repair requests (P2003)', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.delete.mockRejectedValue(
        makePrismaError('P2003'),
      );

      await expect(service.remove(1, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.requestStatus.findUnique.mockResolvedValue(fakeStatus);
      mockPrisma.requestStatus.delete.mockRejectedValue(
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
