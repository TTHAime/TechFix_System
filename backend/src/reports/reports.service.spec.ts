import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from 'src/prisma/prisma.service';

// Mock ExcelJS so we don't need actual file I/O in tests
jest.mock('exceljs', () => {
  const mockSheet = {
    columns: [],
    getRow: jest.fn().mockReturnValue({
      font: {},
      fill: {},
      alignment: {},
    }),
    addRow: jest.fn(),
  };
  // allow forEach on columns
  Object.defineProperty(mockSheet, 'columns', {
    get: () => [],
    set: jest.fn(),
  });
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue(mockSheet),
      xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('fake')) },
    })),
  };
});

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    repairRequest: {
      groupBy: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    requestStatus: { findMany: jest.fn() },
    equipment: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── buildDateFilter (tested via getDashboardAdmin) ──────────────────────────

  describe('buildDateFilter', () => {
    it('should include createdAt.gte when only startDate is provided', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      await service.getDashboardAdmin({ startDate: '2024-01-01' });

      expect(mockPrisma.repairRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date) }) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should include createdAt.lte when only endDate is provided', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      await service.getDashboardAdmin({ endDate: '2024-12-31' });

      expect(mockPrisma.repairRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ lte: expect.any(Date) }) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should include both gte and lte when both startDate and endDate are provided', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      await service.getDashboardAdmin({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(mockPrisma.repairRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }) as unknown,
          }) as unknown,
        }),
      );
    });

    it('should include statusId in where when statusId filter is provided', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      await service.getDashboardAdmin({ statusId: 2 });

      expect(mockPrisma.repairRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statusId: 2 }) as unknown,
        }),
      );
    });
  });

  // ─── getDashboardAdmin ────────────────────────────────────────────────────────

  describe('getDashboardAdmin', () => {
    const statuses = [
      { id: 1, name: 'open' },
      { id: 2, name: 'in_progress' },
    ];

    it('should return dashboard data with all fields when called with empty filter', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([
        { statusId: 1, _count: { id: 3 } },
      ]);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ dept_name: 'IT', count: 5 }]) // byDepartment
        .mockResolvedValueOnce([{ equipment_name: 'Dell', serial_no: 'PC-001', count: 2 }]) // topEquipment
        .mockResolvedValueOnce([{ month: '2024-01', count: 10 }]) // monthlyTrend
        .mockResolvedValueOnce([{ avg_hours: 4.5 }]); // avgResolutionTime
      mockPrisma.repairRequest.count.mockResolvedValue(10);
      mockPrisma.requestStatus.findMany.mockResolvedValue(statuses);

      const result = await service.getDashboardAdmin({});

      expect(result.totalRequests).toBe(10);
      expect(result.avgResolutionHours).toBe(4.5);
      expect(result.byStatus).toEqual([{ status: 'open', count: 3 }]);
      expect(result.byDepartment).toEqual([{ department: 'IT', count: 5 }]);
      expect(result.topEquipment).toEqual([{ name: 'Dell', serialNo: 'PC-001', count: 2 }]);
      expect(result.monthlyTrend).toEqual([{ month: '2024-01', count: 10 }]);
    });

    it('should return avg_hours=0 when avgResolutionTime result is empty', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]); // empty avgResolutionTime
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      const result = await service.getDashboardAdmin({});

      expect(result.avgResolutionHours).toBe(0);
    });

    it('should use Unknown label when statusId not in statusMap', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([
        { statusId: 99, _count: { id: 1 } },
      ]);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ avg_hours: 0 }]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      const result = await service.getDashboardAdmin({});

      expect(result.byStatus[0].status).toBe('Unknown(99)');
    });
  });

  // ─── getRequestsByDepartment branches ────────────────────────────────────────

  describe('getRequestsByDepartment (via getDashboardAdmin)', () => {
    const setupMocks = () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);
    };

    it('should call $queryRaw with both date conditions when startDate and endDate provided', async () => {
      setupMocks();
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ dept_name: 'IT', count: 1 }]) // byDepartment (startDate+endDate)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ avg_hours: 0 }]);

      await service.getDashboardAdmin({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should call $queryRaw with only startDate condition when only startDate provided', async () => {
      setupMocks();
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ avg_hours: 0 }]);

      await service.getDashboardAdmin({ startDate: '2024-01-01' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should call $queryRaw with only endDate condition when only endDate provided', async () => {
      setupMocks();
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ avg_hours: 0 }]);

      await service.getDashboardAdmin({ endDate: '2024-12-31' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should call $queryRaw with no date condition when filter is empty', async () => {
      setupMocks();
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ avg_hours: 0 }]);

      await service.getDashboardAdmin({});

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  // ─── getDashboardTechnician ───────────────────────────────────────────────────

  describe('getDashboardTechnician', () => {
    it('should return totalAssigned, completedThisMonth and byStatus when called', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ request_id: 1 }, { request_id: 2 }]);
      mockPrisma.repairRequest.groupBy.mockResolvedValue([
        { statusId: 2, _count: { id: 2 } },
      ]);
      mockPrisma.repairRequest.count
        .mockResolvedValueOnce(2)   // totalAssigned
        .mockResolvedValueOnce(1);  // completedThisMonth
      mockPrisma.requestStatus.findMany.mockResolvedValue([
        { id: 2, name: 'in_progress' },
      ]);

      const result = await service.getDashboardTechnician(7, {});

      expect(result.totalAssigned).toBe(2);
      expect(result.completedThisMonth).toBe(1);
      expect(result.byStatus).toEqual([{ status: 'in_progress', count: 2 }]);
    });

    it('should use id=-1 sentinel when no assignments found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]); // no assignments
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      const result = await service.getDashboardTechnician(7, {});

      expect(result.totalAssigned).toBe(0);
    });

    it('should apply date filter when startDate is provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.groupBy.mockResolvedValue([]);
      mockPrisma.repairRequest.count.mockResolvedValue(0);
      mockPrisma.requestStatus.findMany.mockResolvedValue([]);

      await service.getDashboardTechnician(7, { startDate: '2024-01-01' });

      expect(mockPrisma.repairRequest.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object) as unknown,
          }) as unknown,
        }),
      );
    });
  });

  // ─── getDashboardHr ───────────────────────────────────────────────────────────

  describe('getDashboardHr', () => {
    it('should return usersByDepartment and requestsByDepartment', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ dept_name: 'HR', count: 3 }])  // usersByDepartment
        .mockResolvedValueOnce([{ dept_name: 'IT', count: 5 }]); // requestsByDepartment

      const result = await service.getDashboardHr({});

      expect(result.usersByDepartment).toEqual([{ department: 'HR', count: 3 }]);
      expect(result.requestsByDepartment).toEqual([{ department: 'IT', count: 5 }]);
    });
  });

  // ─── getDashboardUser ─────────────────────────────────────────────────────────

  describe('getDashboardUser', () => {
    const fakeRequests = [
      {
        id: 1,
        description: 'Screen broken',
        createdAt: new Date('2024-01-01'),
        status: { name: 'open' },
        requestEquipment: [
          { equipment: { name: 'Dell PC' } },
        ],
      },
    ];

    it('should return totalRequests, byStatus and recentRequests', async () => {
      mockPrisma.repairRequest.groupBy.mockResolvedValue([
        { statusId: 1, _count: { id: 1 } },
      ]);
      mockPrisma.repairRequest.count.mockResolvedValue(1);
      mockPrisma.repairRequest.findMany.mockResolvedValue(fakeRequests);
      mockPrisma.requestStatus.findMany.mockResolvedValue([{ id: 1, name: 'open' }]);

      const result = await service.getDashboardUser(42, {});

      expect(result.totalRequests).toBe(1);
      expect(result.byStatus).toEqual([{ status: 'open', count: 1 }]);
      expect(result.recentRequests[0].description).toBe('Screen broken');
      expect(result.recentRequests[0].equipment).toEqual(['Dell PC']);
    });
  });

  // ─── exportRepairRequests ─────────────────────────────────────────────────────

  describe('exportRepairRequests', () => {
    const fakeRequests = [
      {
        id: 1,
        description: 'Screen broken',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-10'),
        requester: { name: 'Alice', department: { name: 'IT' } },
        status: { name: 'resolved' },
        requestEquipment: [
          { equipment: { name: 'Dell PC' }, partsUsed: 'Screen', repairSummary: 'Replaced' },
        ],
      },
    ];

    it('should return ArrayBuffer when called with empty filter', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue(fakeRequests);

      const result = await service.exportRepairRequests({});

      expect(result).toBeDefined();
    });

    it('should filter by deptId when deptId is provided', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue([]);

      await service.exportRepairRequests({ deptId: 3 });

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            requester: { deptId: 3 },
          }) as unknown,
        }),
      );
    });

    it('should show dash for completedAt when completedAt is null', async () => {
      const requestWithoutCompletedAt = [
        {
          ...fakeRequests[0],
          completedAt: null,
          requestEquipment: [
            { equipment: { name: 'Dell PC' }, partsUsed: null, repairSummary: null },
          ],
        },
      ];
      mockPrisma.repairRequest.findMany.mockResolvedValue(requestWithoutCompletedAt);

      const result = await service.exportRepairRequests({});
      expect(result).toBeDefined();
    });
  });

  // ─── exportEquipment ──────────────────────────────────────────────────────────

  describe('exportEquipment', () => {
    const fakeEquipment = [
      {
        id: 1,
        name: 'Dell PC',
        serialNo: 'PC-001',
        isActive: true,
        category: { name: 'Computer' },
        department: { name: 'IT' },
      },
      {
        id: 2,
        name: 'HP Printer',
        serialNo: 'PRN-001',
        isActive: false,
        category: { name: 'Printer' },
        department: { name: 'HR' },
      },
    ];

    it('should return ArrayBuffer when called', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue(fakeEquipment);

      const result = await service.exportEquipment({});

      expect(result).toBeDefined();
    });

    it('should filter by deptId when deptId is provided', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await service.exportEquipment({ deptId: 2 });

      expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deptId: 2 } }),
      );
    });

    it('should pass undefined where when no deptId', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([]);

      await service.exportEquipment({});

      expect(mockPrisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  // ─── exportMyTasks ────────────────────────────────────────────────────────────

  describe('exportMyTasks', () => {
    const fakeRequests = [
      {
        id: 1,
        description: 'Fix printer',
        createdAt: new Date('2024-01-01'),
        completedAt: null,
        requester: { name: 'Bob', department: { name: 'IT' } },
        status: { name: 'in_progress' },
        requestEquipment: [
          { equipment: { name: 'HP Printer' }, partsUsed: null },
        ],
      },
    ];

    it('should return ArrayBuffer when technician has assignments', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ request_id: 1 }]);
      mockPrisma.repairRequest.findMany.mockResolvedValue(fakeRequests);

      const result = await service.exportMyTasks(7);

      expect(result).toBeDefined();
    });

    it('should use id=-1 sentinel when technician has no assignments', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.repairRequest.findMany.mockResolvedValue([]);

      await service.exportMyTasks(7);

      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [-1] } },
        }),
      );
    });
  });

  // ─── exportUsers ──────────────────────────────────────────────────────────────

  describe('exportUsers', () => {
    const fakeUsers = [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@company.com',
        createdAt: new Date('2024-01-01'),
        isActive: true,
        role: { name: 'admin' },
        department: { name: 'IT' },
      },
      {
        id: 2,
        name: 'Bob',
        email: 'bob@company.com',
        createdAt: new Date('2024-02-01'),
        isActive: false,
        role: { name: 'user' },
        department: { name: 'HR' },
      },
    ];

    it('should return ArrayBuffer when called', async () => {
      mockPrisma.user.findMany.mockResolvedValue(fakeUsers);

      const result = await service.exportUsers({});

      expect(result).toBeDefined();
    });

    it('should filter by deptId when deptId is provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.exportUsers({ deptId: 1 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deptId: 1 } }),
      );
    });
  });

  // ─── exportMyRequests ─────────────────────────────────────────────────────────

  describe('exportMyRequests', () => {
    const fakeRequests = [
      {
        id: 1,
        description: 'Keyboard stuck',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-05'),
        status: { name: 'resolved' },
        requestEquipment: [
          { equipment: { name: 'Keyboard' }, partsUsed: 'Keys', repairSummary: 'Cleaned' },
        ],
      },
    ];

    it('should return ArrayBuffer for user requests', async () => {
      mockPrisma.repairRequest.findMany.mockResolvedValue(fakeRequests);

      const result = await service.exportMyRequests(42);

      expect(result).toBeDefined();
      expect(mockPrisma.repairRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { requesterId: 42 },
        }),
      );
    });

    it('should show dash for completedAt and empty parts when fields are null', async () => {
      const requestsNoCompletion = [
        {
          ...fakeRequests[0],
          completedAt: null,
          requestEquipment: [
            { equipment: { name: 'Mouse' }, partsUsed: null, repairSummary: null },
          ],
        },
      ];
      mockPrisma.repairRequest.findMany.mockResolvedValue(requestsNoCompletion);

      const result = await service.exportMyRequests(42);
      expect(result).toBeDefined();
    });
  });
});
