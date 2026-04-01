import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipment, getEquipmentCategories, createEquipment, updateEquipment, deleteEquipment } from './api';

export function useEquipmentQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['equipment', page, limit],
    queryFn: () => getEquipment(page, limit),
  });
}

export function useEquipmentCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: ['equipment-categories'],
    queryFn: () => getEquipmentCategories(),
    enabled,
  });
}

export function useCreateEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; serialNo: string; categoryId: number; deptId: number }) =>
      createEquipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

export function useUpdateEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; serialNo?: string; categoryId?: number; deptId?: number; isActive?: boolean };
    }) => updateEquipment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

export function useDeleteEquipmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}
