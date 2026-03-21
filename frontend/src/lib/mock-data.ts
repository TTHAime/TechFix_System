import type {
  Role,
  Department,
  User,
  EquipmentCategory,
  Equipment,
  RequestStatus,
  RepairRequest,
} from '@/types';

// ─── Roles ───
export const mockRoles: Role[] = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'hr' },
  { id: 3, name: 'technician' },
  { id: 4, name: 'user' },
];

// ─── Departments ───
export const mockDepartments: Department[] = [
  { id: 1, name: 'IT', location: 'Building A, Floor 3' },
  { id: 2, name: 'HR', location: 'Building A, Floor 2' },
  { id: 3, name: 'Accounting', location: 'Building B, Floor 1' },
  { id: 4, name: 'Marketing', location: 'Building B, Floor 2' },
  { id: 5, name: 'Operations', location: 'Building C, Floor 1' },
];

// ─── Request Statuses ───
export const mockStatuses: RequestStatus[] = [
  { id: 1, name: 'open' },
  { id: 2, name: 'in_progress' },
  { id: 3, name: 'resolved' },
  { id: 4, name: 'closed' },
];

// ─── Equipment Categories ───
export const mockCategories: EquipmentCategory[] = [
  { id: 1, name: 'Computers/Laptops' },
  { id: 2, name: 'Printers/Scanners' },
  { id: 3, name: 'Network Equipment' },
  { id: 4, name: 'Peripherals' },
];

// ─── Users ───
export const mockUsers: User[] = [
  {
    id: 1, name: 'Admin User', email: 'admin@company.com',
    roleId: 1, deptId: 1, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[0], department: mockDepartments[0],
  },
  {
    id: 2, name: 'HR Manager', email: 'hr@company.com',
    roleId: 2, deptId: 2, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[1], department: mockDepartments[1],
  },
  {
    id: 3, name: 'Tech One', email: 'tech1@company.com',
    roleId: 3, deptId: 1, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[2], department: mockDepartments[0],
  },
  {
    id: 4, name: 'Tech Two', email: 'tech2@company.com',
    roleId: 3, deptId: 1, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[2], department: mockDepartments[0],
  },
  {
    id: 5, name: 'Somjai', email: 'somjai@company.com',
    roleId: 4, deptId: 3, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[3], department: mockDepartments[2],
  },
  {
    id: 6, name: 'Somsri', email: 'somsri@company.com',
    roleId: 4, deptId: 4, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[3], department: mockDepartments[3],
  },
  {
    id: 7, name: 'Somsak', email: 'somsak@company.com',
    roleId: 4, deptId: 5, provider: 'local', isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    role: mockRoles[3], department: mockDepartments[4],
  },
];

// ─── Equipment ───
export const mockEquipment: Equipment[] = [
  {
    id: 1, name: 'Dell OptiPlex 7090', serialNo: 'DL-OPT-7090-001',
    categoryId: 1, deptId: 3, isActive: true,
    category: mockCategories[0], department: mockDepartments[2],
  },
  {
    id: 2, name: 'Lenovo ThinkPad T14', serialNo: 'LN-TP-T14-001',
    categoryId: 1, deptId: 4, isActive: true,
    category: mockCategories[0], department: mockDepartments[3],
  },
  {
    id: 3, name: 'HP LaserJet Pro M404dn', serialNo: 'HP-LJ-M404-001',
    categoryId: 2, deptId: 3, isActive: true,
    category: mockCategories[1], department: mockDepartments[2],
  },
  {
    id: 4, name: 'Cisco Catalyst 2960', serialNo: 'CS-CAT-2960-001',
    categoryId: 3, deptId: 1, isActive: true,
    category: mockCategories[2], department: mockDepartments[0],
  },
  {
    id: 5, name: 'Samsung 27" Monitor', serialNo: 'SM-MON-27-001',
    categoryId: 4, deptId: 5, isActive: true,
    category: mockCategories[3], department: mockDepartments[4],
  },
];

// ─── Repair Requests ───
export const mockRepairRequests: RepairRequest[] = [
  {
    id: 1, requesterId: 5, statusId: 1,
    description: 'Desktop computer will not power on. No lights, no fan spin.',
    partsUsed: null, repairSummary: null, completedAt: null,
    createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-06-01T09:00:00Z',
    requester: mockUsers[4], status: mockStatuses[0],
    requestEquipment: [{
      id: 1, requestId: 1, equipmentId: 1,
      issueDetail: 'Power button unresponsive, PSU may be dead',
      equipment: mockEquipment[0],
    }],
    assignmentLogs: [],
  },
  {
    id: 2, requesterId: 6, statusId: 2,
    description: 'Laptop screen goes black randomly during use.',
    partsUsed: null, repairSummary: null, completedAt: null,
    createdAt: '2025-06-02T10:30:00Z', updatedAt: '2025-06-03T08:00:00Z',
    requester: mockUsers[5], status: mockStatuses[1],
    requestEquipment: [{
      id: 2, requestId: 2, equipmentId: 2,
      issueDetail: 'Screen flickers then goes black, external monitor works fine',
      equipment: mockEquipment[1],
    }],
    assignmentLogs: [{
      id: 1, requestId: 2, actorId: 1, technicianId: 3,
      action: 'assigned', loggedAt: '2025-06-03T08:00:00Z',
      actor: mockUsers[0], technician: mockUsers[2],
    }],
  },
  {
    id: 3, requesterId: 5, statusId: 3,
    description: 'Printer keeps jamming paper on every print job.',
    partsUsed: 'Pickup roller, separation pad',
    repairSummary: 'Replaced worn pickup roller and separation pad. Test prints successful.',
    completedAt: '2025-06-04T14:00:00Z',
    createdAt: '2025-06-01T11:00:00Z', updatedAt: '2025-06-04T14:00:00Z',
    requester: mockUsers[4], status: mockStatuses[2],
    requestEquipment: [{
      id: 3, requestId: 3, equipmentId: 3,
      issueDetail: 'Paper jams at feeder tray every time',
      equipment: mockEquipment[2],
    }],
    assignmentLogs: [{
      id: 2, requestId: 3, actorId: 1, technicianId: 4,
      action: 'assigned', loggedAt: '2025-06-02T09:00:00Z',
      actor: mockUsers[0], technician: mockUsers[3],
    }],
  },
  {
    id: 4, requesterId: 7, statusId: 1,
    description: 'Monitor displays a persistent vertical green line on the left side.',
    partsUsed: null, repairSummary: null, completedAt: null,
    createdAt: '2025-06-05T08:00:00Z', updatedAt: '2025-06-05T08:00:00Z',
    requester: mockUsers[6], status: mockStatuses[0],
    requestEquipment: [{
      id: 4, requestId: 4, equipmentId: 5,
      issueDetail: 'Green vertical line appears after monitor warms up',
      equipment: mockEquipment[4],
    }],
    assignmentLogs: [],
  },
];
