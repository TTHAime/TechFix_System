import { axiosInstance } from '@/lib/axios';
import type { EquipmentCategory } from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

export async function getEquipmentCategories(
  page = 1,
  limit = 100,
): Promise<PaginatedResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.get<PaginatedResponse<EquipmentCategory>>(
    '/equipment-categories',
    { params: { page, limit } },
  );
  return data;
}

export async function getEquipmentCategoryById(
  id: number,
): Promise<ApiResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.get<ApiResponse<EquipmentCategory>>(
    `/equipment-categories/${id}`,
  );
  return data;
}

export async function createEquipmentCategory(payload: {
  name: string;
}): Promise<ApiResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.post<ApiResponse<EquipmentCategory>>(
    '/equipment-categories',
    payload,
  );
  return data;
}

export async function updateEquipmentCategory(
  id: number,
  payload: { name: string },
): Promise<ApiResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.patch<ApiResponse<EquipmentCategory>>(
    `/equipment-categories/${id}`,
    payload,
  );
  return data;
}

export async function deleteEquipmentCategory(
  id: number,
): Promise<ApiResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.delete<ApiResponse<EquipmentCategory>>(
    `/equipment-categories/${id}`,
  );
  return data;
}
