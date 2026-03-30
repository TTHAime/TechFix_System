import { axiosInstance } from '@/lib/axios';
import type { RepairRequest, StatusLog, AssignmentLog } from '@/types';
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
  payload: { statusId?: number; partsUsed?: string; repairSummary?: string; completedAt?: string },
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

export async function assignTechnician(id: number, technicianId: number): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.patch<ApiResponse<RepairRequest>>(`/repair-requests/${id}/assign`, {
    technicianId,
  });
  return data;
}

export async function unassignTechnician(id: number, technicianId: number): Promise<ApiResponse<RepairRequest>> {
  const { data } = await axiosInstance.patch<ApiResponse<RepairRequest>>(`/repair-requests/${id}/unassign`, {
    technicianId,
  });
  return data;
}

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
