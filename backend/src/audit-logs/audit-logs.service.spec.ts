import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from 'src/prisma/prisma.service';

const fakeActor = { id: 1, name: 'Alice', email: 'alice@example.com' };

const fakeLog = {
  id: 1,
  actorId: 1,
  entityType: 'RepairRequest',
  entityId: 10,
  action: 'UPDATE',
  oldValue: null,
  newValue: null,
  loggedAt: new Date('2026-01-01'),
  actor: fakeActor,
};

const paginationQuery = { page: 1, limit: 20 };

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  const mockPrisma = {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return data and pagination meta when query is valid', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([fakeLog]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll(paginationQuery);

      expect(result.data).toEqual([fakeLog]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findAll({});

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(50);

      await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findByEntity', () => {
    it('should return data filtered by entityType and entityId with pagination meta', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([fakeLog]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findByEntity(
        'RepairRequest',
        10,
        paginationQuery,
      );

      expect(result.data).toEqual([fakeLog]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should pass correct where clause to both findMany and count', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.findByEntity('Equipment', 5, paginationQuery);

      const expectedWhere = { entityType: 'Equipment', entityId: 5 };
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('should calculate correct skip when page is greater than 1', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(30);

      await service.findByEntity('RepairRequest', 10, { page: 2, limit: 5 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('create', () => {
    it('should return the created audit log and pass serialized values to Prisma', async () => {
      const params = {
        actorId: 1,
        entityType: 'RepairRequest',
        entityId: 10,
        action: 'UPDATE',
        oldValue: { status: 'PENDING' },
        newValue: { status: 'IN_PROGRESS' },
      };
      mockPrisma.auditLog.create.mockResolvedValue(fakeLog);

      const result = await service.create(params);

      expect(result).toEqual(fakeLog);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          entityType: 'RepairRequest',
          entityId: 10,
          action: 'UPDATE',
          oldValue: { status: 'PENDING' },
          newValue: { status: 'IN_PROGRESS' },
        },
      });
    });

    it('should pass undefined oldValue and newValue to Prisma when they are not provided', async () => {
      const params = {
        actorId: 1,
        entityType: 'Equipment',
        entityId: 3,
        action: 'CREATE',
      };
      mockPrisma.auditLog.create.mockResolvedValue(fakeLog);

      await service.create(params);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 1,
          entityType: 'Equipment',
          entityId: 3,
          action: 'CREATE',
          oldValue: undefined,
          newValue: undefined,
        },
      });
    });
  });
});
