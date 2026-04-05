import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { Prisma } from 'src/generated/prisma/client';

const fakeRole = { id: 1, name: 'Admin' };
const fakeRole2 = { id: 2, name: 'Technician' };

const createDto = { name: 'Admin' };
const updateDto = { name: 'Admin Updated' };
const actorId = 99;

const paginationQuery = { page: 1, limit: 20 };

function makePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: '0.0.0',
  });
}

describe('RolesService', () => {
  let service: RolesService;

  const mockPrisma = {
    role: {
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
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return the created role when input is valid', async () => {
      mockPrisma.role.create.mockResolvedValue(fakeRole);

      const result = await service.create(createDto, actorId);

      expect(result).toEqual(fakeRole);
    });

    it('should call auditLogsService.create after successful creation', async () => {
      mockPrisma.role.create.mockResolvedValue(fakeRole);

      await service.create(createDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'role',
          entityId: fakeRole.id,
          action: 'created',
          newValue: fakeRole,
        }),
      );
    });

    it('should log the creation', async () => {
      mockPrisma.role.create.mockResolvedValue(fakeRole);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.create(createDto, actorId);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('created'));
    });

    it('should throw ConflictException when role name is duplicate (P2002)', async () => {
      mockPrisma.role.create.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.role.create.mockRejectedValue(new Error('DB connection lost'));
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.create(createDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.role.findMany.mockResolvedValue([fakeRole, fakeRole2]);
      mockPrisma.role.count.mockResolvedValue(2);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeRole, fakeRole2]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 2 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.role.findMany.mockResolvedValue([fakeRole]);
      mockPrisma.role.count.mockResolvedValue(1);

      await service.findAll({});

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);
      mockPrisma.role.count.mockResolvedValue(30);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the role when id exists', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);

      const result = await service.findOne(1);

      expect(result).toEqual(fakeRole);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should return the updated role when input is valid', async () => {
      const updatedRole = { ...fakeRole, name: updateDto.name };
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.update.mockResolvedValue(updatedRole);

      const result = await service.update(1, updateDto, actorId);

      expect(result).toEqual(updatedRole);
    });

    it('should call auditLogsService.create with old and new values after update', async () => {
      const updatedRole = { ...fakeRole, name: updateDto.name };
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.update.mockResolvedValue(updatedRole);

      await service.update(1, updateDto, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'role',
          entityId: 1,
          action: 'updated',
          oldValue: fakeRole,
          newValue: updatedRole,
        }),
      );
    });

    it('should throw NotFoundException when role does not exist (P2025)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.update(999, updateDto, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when role name is duplicate (P2002)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.update.mockRejectedValue(makePrismaError('P2002'));

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.update.mockRejectedValue(new Error('DB connection lost'));
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.update(1, updateDto, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should return the deleted role when id exists', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.delete.mockResolvedValue(fakeRole);

      const result = await service.remove(1, actorId);

      expect(result).toEqual(fakeRole);
    });

    it('should call auditLogsService.create with action deleted after removal', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.delete.mockResolvedValue(fakeRole);

      await service.remove(1, actorId);

      expect(mockAuditLogs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          entityType: 'role',
          entityId: 1,
          action: 'deleted',
          oldValue: fakeRole,
        }),
      );
    });

    it('should throw NotFoundException when role does not exist (P2025)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.delete.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.remove(999, actorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when role still has users assigned (P2003)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.delete.mockRejectedValue(makePrismaError('P2003'));

      await expect(service.remove(1, actorId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log error and re-throw unexpected errors', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(fakeRole);
      mockPrisma.role.delete.mockRejectedValue(new Error('DB connection lost'));
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.remove(1, actorId)).rejects.toThrow(
        'DB connection lost',
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
