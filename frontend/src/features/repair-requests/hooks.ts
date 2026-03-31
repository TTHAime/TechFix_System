import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRepairRequests,
  getRepairRequestById,
  createRepairRequest,
  updateRepairRequest,
  closeRepairRequest,
  confirmRepairRequest,
  acceptItem,
  assignItem,
  unassignItem,
  resolveItem,
  getStatusLogs,
  getAssignmentLogs,
  getAllAssignmentLogs,
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

export function useAllAssignmentLogsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['assignment-logs', page, limit],
    queryFn: () => getAllAssignmentLogs(page, limit),
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

export function useConfirmRepairRequestMutation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => confirmRepairRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

// ─── Per-item mutations ───────────────────────────────────────────────────────

export function useAcceptItemMutation(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => acceptItem(requestId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useAssignItemMutation(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, technicianId }: { itemId: number; technicianId: number }) =>
      assignItem(requestId, itemId, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useUnassignItemMutation(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => unassignItem(requestId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}

export function useResolveItemMutation(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, note }: { itemId: number; note?: string }) => resolveItem(requestId, itemId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });
}
