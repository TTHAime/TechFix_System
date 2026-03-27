import { axiosInstance } from '@/lib/axios';
import type { Equipment, EquipmentCategory } from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

export async function getEquipment(page = 1, limit = 20): Promise<PaginatedResponse<Equipment>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Equipment>>('/equipment', {
    params: { page, limit },
  });
  return data;
}

export async function getEquipmentById(id: number): Promise<ApiResponse<Equipment>> {
  const { data } = await axiosInstance.get<ApiResponse<Equipment>>(`/equipment/${id}`);
  return data;
}

export async function createEquipment(payload: {
  name: string;
  serialNo: string;
  categoryId: number;
  deptId: number;
}): Promise<ApiResponse<Equipment>> {
  const { data } = await axiosInstance.post<ApiResponse<Equipment>>('/equipment', payload);
  return data;
}

export async function updateEquipment(
  id: number,
  payload: { name?: string; serialNo?: string; categoryId?: number; deptId?: number; isActive?: boolean },
): Promise<ApiResponse<Equipment>> {
  const { data } = await axiosInstance.patch<ApiResponse<Equipment>>(`/equipment/${id}`, payload);
  return data;
}

export async function deleteEquipment(id: number): Promise<ApiResponse<Equipment>> {
  const { data } = await axiosInstance.delete<ApiResponse<Equipment>>(`/equipment/${id}`);
  return data;
}

export async function getEquipmentCategories(): Promise<PaginatedResponse<EquipmentCategory>> {
  const { data } = await axiosInstance.get<PaginatedResponse<EquipmentCategory>>('/equipment-categories', {
    params: { page: 1, limit: 100 },
  });
  return data;
}
