import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEquipmentCategories,
  createEquipmentCategory,
  updateEquipmentCategory,
  deleteEquipmentCategory,
} from './api';

export function useEquipmentCategoriesQuery(page = 1, limit = 100, enabled = true) {
  return useQuery({
    queryKey: ['equipment-categories', page, limit],
    queryFn: () => getEquipmentCategories(page, limit),
    enabled,
  });
}

export function useCreateEquipmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => createEquipmentCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-categories'] });
    },
  });
}

export function useUpdateEquipmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string } }) =>
      updateEquipmentCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-categories'] });
    },
  });
}

export function useDeleteEquipmentCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEquipmentCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-categories'] });
    },
  });
}
