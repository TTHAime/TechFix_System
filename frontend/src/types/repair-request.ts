import type { User } from './user';
import type { Equipment } from './equipment';

export type RequestStatusName = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface RequestStatus {
  id: number;
  name: RequestStatusName;
}

export interface RequestEquipment {
  id: number;
  requestId: number;
  equipmentId: number;
  issueDetail: string;
  statusId: number;
  technicianId: number | null;
  resolvedAt: string | null;
  equipment: Equipment;
  status: RequestStatus;
  technician: User | null;
}

export interface AssignmentLog {
  id: number;
  requestId: number;
  itemId: number | null;
  actorId: number;
  technicianId: number;
  action: 'assigned' | 'unassigned';
  loggedAt: string;
  actor: User;
  technician: User;
  item: RequestEquipment | null;
}

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
