import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRepairRequests,
  getRepairRequestById,
  createRepairRequest,
  updateRepairRequest,
  closeRepairRequest,
  assignTechnician,
  unassignTechnician,
  getStatusLogs,
  getAssignmentLogs,
} from './api';

export function useRepairRequestsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['repair-requests', page, limit],
    queryFn: () => getRepairRequests(page, limit),
  });
}

export function useRepairRequestQuery(id: number) {
  return useQuery({
    queryKey: ['repair-requests', id],
    queryFn: () => getRepairRequestById(id),
    enabled: !!id,
  });
}

export function useStatusLogsQuery(id: number) {
  return useQuery({
    queryKey: ['repair-requests', id, 'status-logs'],
    queryFn: () => getStatusLogs(id),
    enabled: !!id,
  });
}

export function useAssignmentLogsQuery(id: number) {
  return useQuery({
    queryKey: ['repair-requests', id, 'assignment-logs'],
    queryFn: () => getAssignmentLogs(id),
    enabled: !!id,
  });
}

export function useCreateRepairRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRepairRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useUpdateRepairRequestMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { statusId?: number; partsUsed?: string; repairSummary?: string; completedAt?: string }) =>
      updateRepairRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useCloseRepairRequestMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeRepairRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useAssignTechnicianMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (technicianId: number) => assignTechnician(id, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useUnassignTechnicianMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unassignTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}
