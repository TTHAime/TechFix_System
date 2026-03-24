// TODO: Replace mock with real API when backend is ready
import { mockEquipment, mockCategories } from '@/lib/mock-data';
import type { Equipment, EquipmentCategory } from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

export async function getEquipment(page = 1, limit = 20): Promise<PaginatedResponse<Equipment>> {
  return { data: mockEquipment, message: 'Equipment retrieved', meta: { page, limit, total: mockEquipment.length } };
}

export async function getEquipmentCategories(): Promise<ApiResponse<EquipmentCategory[]>> {
  return { data: mockCategories, message: 'Categories retrieved' };
}
