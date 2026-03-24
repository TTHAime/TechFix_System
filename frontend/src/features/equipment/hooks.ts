import { useQuery } from '@tanstack/react-query';
import { getEquipment, getEquipmentCategories } from './api';

export function useEquipmentQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['equipment', page, limit],
    queryFn: () => getEquipment(page, limit),
  });
}

export function useEquipmentCategoriesQuery() {
  return useQuery({
    queryKey: ['equipment-categories'],
    queryFn: () => getEquipmentCategories(),
  });
}
