import { axiosInstance } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type {
  AdminDashboard,
  TechnicianDashboard,
  HrDashboard,
  UserDashboard,
  ReportFilter,
} from './types';

// ─── Dashboard APIs ───────────────────────────────────────────────

export async function getDashboardAdmin(
  filter?: ReportFilter,
): Promise<ApiResponse<AdminDashboard>> {
  const { data } = await axiosInstance.get<ApiResponse<AdminDashboard>>(
    '/reports/dashboard/admin',
    { params: filter },
  );
  return data;
}

export async function getDashboardTechnician(
  filter?: ReportFilter,
): Promise<ApiResponse<TechnicianDashboard>> {
  const { data } = await axiosInstance.get<ApiResponse<TechnicianDashboard>>(
    '/reports/dashboard/technician',
    { params: filter },
  );
  return data;
}

export async function getDashboardHr(
  filter?: ReportFilter,
): Promise<ApiResponse<HrDashboard>> {
  const { data } = await axiosInstance.get<ApiResponse<HrDashboard>>(
    '/reports/dashboard/hr',
    { params: filter },
  );
  return data;
}

export async function getDashboardUser(
  filter?: ReportFilter,
): Promise<ApiResponse<UserDashboard>> {
  const { data } = await axiosInstance.get<ApiResponse<UserDashboard>>(
    '/reports/dashboard/user',
    { params: filter },
  );
  return data;
}

// ─── Export APIs (return blob for file download) ──────────────────

async function downloadExcel(url: string, filename: string, filter?: ReportFilter) {
  const response = await axiosInstance.get(url, {
    params: filter,
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportRepairRequests(filter?: ReportFilter) {
  return downloadExcel('/reports/export/repair-requests', 'repair-requests.xlsx', filter);
}

export function exportEquipment(filter?: ReportFilter) {
  return downloadExcel('/reports/export/equipment', 'equipment.xlsx', filter);
}

export function exportMyTasks() {
  return downloadExcel('/reports/export/my-tasks', 'my-tasks.xlsx');
}

export function exportUsers(filter?: ReportFilter) {
  return downloadExcel('/reports/export/users', 'users.xlsx', filter);
}

export function exportMyRequests() {
  return downloadExcel('/reports/export/my-requests', 'my-requests.xlsx');
}
