// ─── Roles ───
export type RoleName = 'admin' | 'hr' | 'technician' | 'user';

export interface Role {
  id: number;
  name: RoleName;
}

// ─── Departments ───
export interface Department {
  id: number;
  name: string;
  location: string;
}

// ─── Users ───
export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  deptId: number;
  provider: 'local' | 'google';
  isActive: boolean;
  createdAt: string;
  role: Role;
  department: Department;
}

// ─── Equipment ───
export interface EquipmentCategory {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
  serialNo: string;
  categoryId: number;
  deptId: number;
  isActive: boolean;
  category: EquipmentCategory;
  department: Department;
}

// ─── Request Status ───
export type RequestStatusName = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface RequestStatus {
  id: number;
  name: RequestStatusName;
}

// ─── Repair Requests ───
export interface RequestEquipment {
  id: number;
  requestId: number;
  equipmentId: number;
  issueDetail: string;
  equipment: Equipment;
}

export interface RepairRequest {
  id: number;
  requesterId: number;
  statusId: number;
  description: string;
  partsUsed: string | null;
  repairSummary: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: User;
  status: RequestStatus;
  requestEquipment: RequestEquipment[];
  assignmentLogs: AssignmentLog[];
}

// ─── Status Logs ───
export interface StatusLog {
  id: number;
  requestId: number;
  changedBy: number;
  oldStatusId: number;
  newStatusId: number;
  note: string | null;
  changedAt: string;
  changer: User;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
}

// ─── Assignment Logs ───
export interface AssignmentLog {
  id: number;
  requestId: number;
  actorId: number;
  technicianId: number;
  action: 'assigned' | 'unassigned';
  loggedAt: string;
  actor: User;
  technician: User;
}

// ─── Audit Logs ───
export interface AuditLog {
  id: number;
  actorId: number;
  entityType: string;
  entityId: number;
  action: 'created' | 'updated' | 'deleted';
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  loggedAt: string;
  actor: User;
}

// ─── API Response ───
export interface ApiResponse<T> {
  data: T;
  message: string;
}
