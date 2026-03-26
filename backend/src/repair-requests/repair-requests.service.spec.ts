import { Test, TestingModule } from '@nestjs/testing';
import { RepairRequestsService } from './repair-requests.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { Role } from 'src/common/enums/role.enum';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('RepairRequestsService', () => {
  let service: RepairRequestsService;

  const mockTx = {
    repairRequest: { create: jest.fn(), update: jest.fn() },
    statusLog: { create: jest.fn() },
  };

  const mockPrisma = {
    requestStatus: { findFirst: jest.fn() },
    repairRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    statusLog: { findMany: jest.fn() },
    assignmentLog: { create: jest.fn(), findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest
      .fn()
      .mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  };

  const openStatus = { id: 1, name: 'Open' };
  const closedStatus = { id: 3, name: 'Closed' };

  const fakeRequest = {
    id: 10,
    requesterId: 42,
    statusId: openStatus.id,
    description: 'Screen broken',
    requestEquipment: [],
    requester: { id: 42, name: 'Alice' },
    status: openStatus,
    statusLogs: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RepairRequestsService>(RepairRequestsService);

    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns request when requester views their own', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 42, Role.User);
      expect(result).toEqual(fakeRequest);
    });

    it('throws ForbiddenException when non-owner regular user tries to view', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      await expect(service.findOne(10, 99, Role.User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows Admin to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.Admin);
      expect(result).toEqual(fakeRequest);
    });

    it('allows HR to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.HR);
      expect(result).toEqual(fakeRequest);
    });

    it('allows Technician to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.Technician);
      expect(result).toEqual(fakeRequest);
    });

    it('throws NotFoundException when request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999, 42, Role.User)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      description: 'Keyboard broken',
      equipments: [{ equipmentId: 5, issueDetail: 'Keys stuck' }],
    };

    it('creates request and statusLog inside a transaction', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.repairRequest.create.mockResolvedValue(fakeRequest);
      mockTx.statusLog.create.mockResolvedValue({});

      await service.create(dto, 42);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.repairRequest.create).toHaveBeenCalledTimes(1);
      expect(mockTx.statusLog.create).toHaveBeenCalledTimes(1);
    });

    it('creates statusLog with note "Request created"', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.repairRequest.create.mockResolvedValue(fakeRequest);
      mockTx.statusLog.create.mockResolvedValue({});

      await service.create(dto, 42);

      expect(mockTx.statusLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ note: 'Request created' }) as unknown,
        }),
      );
    });

    it('throws BadRequestException on invalid equipmentId (P2003)', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.statusLog.create.mockResolvedValue({});
      const p2003 = new Prisma.PrismaClientKnownRequestError('FK fail', {
        code: 'P2003',
        clientVersion: '7.0.0',
      });
      mockTx.repairRequest.create.mockRejectedValue(p2003);

      await expect(service.create(dto, 42)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if Open status does not exist', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 42)).rejects.toThrow(NotFoundException);
    });

    it('re-throws non-P2003 errors without wrapping', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.statusLog.create.mockResolvedValue({});
      const unexpectedError = new Error('DB connection lost');
      mockTx.repairRequest.create.mockRejectedValue(unexpectedError);

      await expect(service.create(dto, 42)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('re-throws non-P2003 Prisma errors without wrapping', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.statusLog.create.mockResolvedValue({});
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '7.0.0' },
      );
      mockTx.repairRequest.create.mockRejectedValue(p2002);

      await expect(service.create(dto, 42)).rejects.toThrow(p2002);
    });
  });

  describe('update', () => {
    it('creates statusLog when statusId changes', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { statusId: 2 }, 99);

      expect(mockTx.statusLog.create).toHaveBeenCalledTimes(1);
    });

    it('does NOT create statusLog when statusId is unchanged', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { statusId: openStatus.id }, 99);

      expect(mockTx.statusLog.create).not.toHaveBeenCalled();
    });

    it('does NOT create statusLog when statusId is not provided', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { repairSummary: 'Fixed' }, 99);

      expect(mockTx.statusLog.create).not.toHaveBeenCalled();
    });

    it('updates partsUsed and completedAt when provided', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      const completedAt = '2024-06-01T00:00:00.000Z';
      await service.update(10, { partsUsed: 'Screen, cable', completedAt }, 99);

      expect(mockTx.repairRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partsUsed: 'Screen, cable',
            completedAt,
          }) as unknown,
        }),
      );
    });

    it('throws BadRequestException on invalid statusId (P2003)', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const p2003 = new Prisma.PrismaClientKnownRequestError('FK fail', {
        code: 'P2003',
        clientVersion: '7.0.0',
      });
      mockTx.repairRequest.update.mockRejectedValue(p2003);

      await expect(service.update(10, { statusId: 99 }, 42)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { statusId: 2 }, 42)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('re-throws non-P2003 errors without wrapping', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const unexpectedError = new Error('DB connection lost');
      mockTx.repairRequest.update.mockRejectedValue(unexpectedError);

      await expect(service.update(10, { statusId: 2 }, 99)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('re-throws non-P2003 Prisma errors without wrapping', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '7.0.0' },
      );
      mockTx.repairRequest.update.mockRejectedValue(p2002);

      await expect(service.update(10, { statusId: 2 }, 99)).rejects.toThrow(
        p2002,
      );
    });
  });

  describe('findAll', () => {
    it('returns only own requests for regular user', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(42, Role.User, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { requesterId: 42 } }),
      );
    });

    it('returns all requests for Admin', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.Admin, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns all requests for HR', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.HR, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns all requests for Technician', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.Technician, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('returns correct pagination meta', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(50);

      const result = await service.findAll(42, Role.User, {
        page: 2,
        limit: 10,
      });

      expect(result.meta).toEqual({ page: 2, limit: 10, total: 50 });
    });

    it('uses default page=1 and limit=20 when not provided', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(42, Role.User, {});

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('assignTechnician', () => {
    const fakeTechnician = {
      id: 7,
      name: 'Bob',
      role: { name: Role.Technician },
    };
    const fakeLog = {
      id: 1,
      requestId: 10,
      technicianId: 7,
      action: 'assigned',
    };

    it('creates assignmentLog with action "assigned" on success', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.user.findUnique.mockResolvedValue(fakeTechnician);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await service.assignTechnician(10, 7, 99);

      expect(mockPrisma.assignmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'assigned' }) as unknown,
        }),
      );
    });

    it('throws BadRequestException when target user is not a Technician', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeTechnician,
        role: { name: Role.User },
      });
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.assignTechnician(10, 7, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when target user does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.assignTechnician(10, 99, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when repair request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(fakeTechnician);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.assignTechnician(999, 7, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unassignTechnician', () => {
    const fakeLog = {
      id: 2,
      requestId: 10,
      technicianId: 7,
      action: 'unassigned',
    };

    it('creates assignmentLog with action "unassigned" on success', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await service.unassignTechnician(10, 7, 99);

      expect(mockPrisma.assignmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'unassigned' }) as unknown,
        }),
      );
    });

    it('throws NotFoundException when repair request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.unassignTechnician(999, 7, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('close', () => {
    it('updates request with Closed status', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(closedStatus);
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: closedStatus.id,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.close(10, 42);

      expect(mockTx.repairRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusId: closedStatus.id,
          }) as unknown,
        }),
      );
    });

    it('throws NotFoundException if Closed status does not exist', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(null);
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);

      await expect(service.close(10, 42)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatusLogs', () => {
    const fakeLogs = [
      { id: 1, requestId: 10, changedAt: new Date('2024-01-01') },
      { id: 2, requestId: 10, changedAt: new Date('2024-01-02') },
    ];

    it('returns logs ordered by changedAt asc for valid request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.statusLog.findMany.mockResolvedValue(fakeLogs);

      const result = await service.getStatusLogs(10);

      expect(mockPrisma.statusLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { changedAt: 'asc' } }),
      );
      expect(result).toEqual(fakeLogs);
    });

    it('throws NotFoundException for non-existent request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);

      await expect(service.getStatusLogs(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAssignmentLogs', () => {
    const fakeLogs = [
      { id: 1, requestId: 10, loggedAt: new Date('2024-01-02') },
      { id: 2, requestId: 10, loggedAt: new Date('2024-01-01') },
    ];

    it('returns logs ordered by loggedAt desc for valid request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.assignmentLog.findMany.mockResolvedValue(fakeLogs);

      const result = await service.getAssignmentLogs(10);

      expect(mockPrisma.assignmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { loggedAt: 'desc' } }),
      );
      expect(result).toEqual(fakeLogs);
    });

    it('throws NotFoundException for non-existent request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);

      await expect(service.getAssignmentLogs(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
