import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getDashboardAdmin,
  getDashboardTechnician,
  getDashboardHr,
  getDashboardUser,
  exportRepairRequests,
  exportEquipment,
  exportMyTasks,
  exportUsers,
  exportMyRequests,
} from './api';
import type { ReportFilter } from './types';

export function useAdminDashboardQuery(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'admin', filter],
    queryFn: () => getDashboardAdmin(filter),
  });
}

export function useTechnicianDashboardQuery(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'technician', filter],
    queryFn: () => getDashboardTechnician(filter),
  });
}

export function useHrDashboardQuery(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'hr', filter],
    queryFn: () => getDashboardHr(filter),
  });
}

export function useUserDashboardQuery(filter?: ReportFilter) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'user', filter],
    queryFn: () => getDashboardUser(filter),
  });
}

export function useExportRepairRequestsMutation() {
  return useMutation({ mutationFn: exportRepairRequests });
}

export function useExportEquipmentMutation() {
  return useMutation({ mutationFn: exportEquipment });
}

export function useExportMyTasksMutation() {
  return useMutation({ mutationFn: () => exportMyTasks() });
}

export function useExportUsersMutation() {
  return useMutation({ mutationFn: exportUsers });
}

export function useExportMyRequestsMutation() {
  return useMutation({ mutationFn: () => exportMyRequests() });
}
