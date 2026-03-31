import { axiosInstance } from '@/lib/axios';
import type { RepairRequest, RequestEquipment, StatusLog, AssignmentLog } from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

export async function getRepairRequests(page = 1, limit = 20): Promise<PaginatedResponse<RepairRequest>> {
  const { data } = await axiosInstance.get<PaginatedResponse<RepairRequest>>('/repair-requests', {
    params: { page, limit },
  });
  return data;
}

export async function getRepairRequestById(id: number): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.get<ApiResponse<RepairRequest>>(`/repair-requests/${id}`);
  return data;
}

export async function createRepairRequest(payload: {
  description: string;
  equipments: Array<{ equipmentId: number; issueDetail: string }>;
}): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.post<ApiResponse<RepairRequest>>('/repair-requests', payload);
  return data;
}

export async function updateRepairRequest(
  id: number,
  payload: { statusId?: number; completedAt?: string },
): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.patch<ApiResponse<RepairRequest>>(`/repair-requests/${id}`, payload);
  return data;
}

export async function closeRepairRequest(id: number): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.patch<ApiResponse<RepairRequest>>(`/repair-requests/${id}/close`);
  return data;
}

export async function confirmRepairRequest(id: number): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.patch<ApiResponse<RepairRequest>>(`/repair-requests/${id}/confirm`);
  return data;
}

// ─── Per-item endpoints ───────────────────────────────────────────────────────

/** Technician self-accepts (claims) a specific item by seqNo */
export async function acceptItem(requestId: number, seqNo: number): Promise<ApiResponse<RequestEquipment>> {
  const { data } = await axiosInstance.patch<ApiResponse<RequestEquipment>>(
    `/repair-requests/${requestId}/items/${seqNo}/accept`,
  );
  return data;
}

/** Admin assigns a specific item to a technician */
export async function assignItem(
  requestId: number,
  seqNo: number,
  technicianId: number,
): Promise<ApiResponse<RequestEquipment>> {
  const { data } = await axiosInstance.patch<ApiResponse<RequestEquipment>>(
    `/repair-requests/${requestId}/items/${seqNo}/assign`,
    { technicianId },
  );
  return data;
}

/** Admin unassigns a technician from a specific item */
export async function unassignItem(requestId: number, seqNo: number): Promise<ApiResponse<RequestEquipment>> {
  const { data } = await axiosInstance.patch<ApiResponse<RequestEquipment>>(
    `/repair-requests/${requestId}/items/${seqNo}/unassign`,
  );
  return data;
}

/** Technician resolves a specific item, with optional parts and summary */
export async function resolveItem(
  requestId: number,
  seqNo: number,
  payload: { note?: string; partsUsed?: string; repairSummary?: string },
): Promise<ApiResponse<RequestEquipment>> {
  const { data } = await axiosInstance.patch<ApiResponse<RequestEquipment>>(
    `/repair-requests/${requestId}/items/${seqNo}/resolve`,
    payload,
  );
  return data;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export async function getStatusLogs(id: number): Promise<ApiResponse<StatusLog[]>> {
  const { data } = await axiosInstance.get<ApiResponse<StatusLog[]>>(`/repair-requests/${id}/status-logs`);
  return data;
}

export async function getAssignmentLogs(id: number): Promise<ApiResponse<AssignmentLog[]>> {
  const { data } = await axiosInstance.get<ApiResponse<AssignmentLog[]>>(`/repair-requests/${id}/assignment-logs`);
  return data;
}

export async function getAllAssignmentLogs(page = 1, limit = 20): Promise<PaginatedResponse<AssignmentLog>> {
  const { data } = await axiosInstance.get<PaginatedResponse<AssignmentLog>>('/repair-requests/assignment-logs', {
    params: { page, limit },
  });
  return data;
}
