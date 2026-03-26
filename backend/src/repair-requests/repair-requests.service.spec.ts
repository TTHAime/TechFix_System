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
    it('should return request when requester views their own', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 42, Role.User);
      expect(result).toEqual(fakeRequest);
    });

    it('should throw ForbiddenException when non-owner regular user tries to view', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      await expect(service.findOne(10, 99, Role.User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow Admin to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.Admin);
      expect(result).toEqual(fakeRequest);
    });

    it('should allow HR to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.HR);
      expect(result).toEqual(fakeRequest);
    });

    it('should allow Technician to view any request', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const result = await service.findOne(10, 99, Role.Technician);
      expect(result).toEqual(fakeRequest);
    });

    it('should throw NotFoundException when request does not exist', async () => {
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

    it('should create request and statusLog inside a transaction when input is valid', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.repairRequest.create.mockResolvedValue(fakeRequest);
      mockTx.statusLog.create.mockResolvedValue({});

      await service.create(dto, 42);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.repairRequest.create).toHaveBeenCalledTimes(1);
      expect(mockTx.statusLog.create).toHaveBeenCalledTimes(1);
    });

    it('should create statusLog with note "Request created" when request is created', async () => {
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

    it('should throw BadRequestException when equipmentId is invalid (P2003)', async () => {
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

    it('should throw NotFoundException when Open status does not exist', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 42)).rejects.toThrow(NotFoundException);
    });

    it('should re-throw non-P2003 errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.requestStatus.findFirst.mockResolvedValue(openStatus);
      mockTx.statusLog.create.mockResolvedValue({});
      const unexpectedError = new Error('DB connection lost');
      mockTx.repairRequest.create.mockRejectedValue(unexpectedError);

      await expect(service.create(dto, 42)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('should re-throw non-P2003 Prisma errors without wrapping when error code is not P2003', async () => {
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
    it('should create statusLog when statusId changes', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { statusId: 2 }, 99);

      expect(mockTx.statusLog.create).toHaveBeenCalledTimes(1);
    });

    it('should not create statusLog when statusId is unchanged', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { statusId: openStatus.id }, 99);

      expect(mockTx.statusLog.create).not.toHaveBeenCalled();
    });

    it('should not create statusLog when statusId is not provided', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockTx.repairRequest.update.mockResolvedValue({
        ...fakeRequest,
        statusId: 2,
      });
      mockTx.statusLog.create.mockResolvedValue({});

      await service.update(10, { repairSummary: 'Fixed' }, 99);

      expect(mockTx.statusLog.create).not.toHaveBeenCalled();
    });

    it('should update partsUsed and completedAt when provided', async () => {
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

    it('should throw BadRequestException when statusId is invalid (P2003)', async () => {
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

    it('should throw NotFoundException when request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { statusId: 2 }, 42)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should re-throw non-P2003 errors without wrapping when an unknown error occurs', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      const unexpectedError = new Error('DB connection lost');
      mockTx.repairRequest.update.mockRejectedValue(unexpectedError);

      await expect(service.update(10, { statusId: 2 }, 99)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('should re-throw non-P2003 Prisma errors without wrapping when error code is not P2003', async () => {
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
    it('should return only own requests when user role is User', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(42, Role.User, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { requesterId: 42 } }),
      );
    });

    it('should return all requests when user role is Admin', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.Admin, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should return all requests when user role is HR', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.HR, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should return all requests when user role is Technician', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);

      await service.findAll(99, Role.Technician, { page: 1, limit: 20 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should return correct pagination meta when page and limit are provided', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([fakeRequest]);
      mockPrisma.repairRequest.count.mockResolvedValue(50);

      const result = await service.findAll(42, Role.User, {
        page: 2,
        limit: 10,
      });

      expect(result.meta).toEqual({ page: 2, limit: 10, total: 50 });
    });

    it('should use default page=1 and limit=20 when pagination params are not provided', async () => {
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

    it('should create assignmentLog with action "assigned" when technician is assigned', async () => {
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

    it('should throw BadRequestException when target user is not a Technician', async () => {
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

    it('should throw BadRequestException when target user does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.assignTechnician(10, 99, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when repair request does not exist', async () => {
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

    it('should create assignmentLog with action "unassigned" when technician is unassigned', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await service.unassignTechnician(10, 7, 99);

      expect(mockPrisma.assignmentLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'unassigned' }) as unknown,
        }),
      );
    });

    it('should throw NotFoundException when repair request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);
      mockPrisma.assignmentLog.create.mockResolvedValue(fakeLog);

      await expect(service.unassignTechnician(999, 7, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('close', () => {
    it('should update request with Closed status when request exists', async () => {
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

    it('should throw NotFoundException when Closed status does not exist', async () => {
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

    it('should return logs ordered by changedAt asc when request exists', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.statusLog.findMany.mockResolvedValue(fakeLogs);

      const result = await service.getStatusLogs(10);

      expect(mockPrisma.statusLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { changedAt: 'asc' } }),
      );
      expect(result).toEqual(fakeLogs);
    });

    it('should throw NotFoundException when request does not exist', async () => {
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

    it('should return logs ordered by loggedAt desc when request exists', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(fakeRequest);
      mockPrisma.assignmentLog.findMany.mockResolvedValue(fakeLogs);

      const result = await service.getAssignmentLogs(10);

      expect(mockPrisma.assignmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { loggedAt: 'desc' } }),
      );
      expect(result).toEqual(fakeLogs);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      mockPrisma.repairRequest.findUnique.mockResolvedValue(null);

      await expect(service.getAssignmentLogs(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
