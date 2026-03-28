import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './api';

export function useDepartmentsQuery(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['departments', page, limit],
    queryFn: () => getDepartments(page, limit),
    enabled,
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; location: string }) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; location?: string } }) =>
      updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
