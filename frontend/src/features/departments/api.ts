import { axiosInstance } from '@/lib/axios';
import type { Department } from '@/types';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getDepartments(page = 1, limit = 20): Promise<PaginatedResponse<Department>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Department>>('/departments', {
    params: { page, limit },
  });
  return data;
}

export async function getDepartmentById(id: number): Promise<ApiResponse<Department>> {
  const { data } = await axiosInstance.get<ApiResponse<Department>>(`/departments/${id}`);
  return data;
}

export async function createDepartment(payload: { name: string; location: string }): Promise<ApiResponse<Department>> {
  const { data } = await axiosInstance.post<ApiResponse<Department>>('/departments', payload);
  return data;
}

export async function updateDepartment(id: number, payload: { name?: string; location?: string }): Promise<ApiResponse<Department>> {
  const { data } = await axiosInstance.patch<ApiResponse<Department>>(`/departments/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: number): Promise<ApiResponse<Department>> {
  const { data } = await axiosInstance.delete<ApiResponse<Department>>(`/departments/${id}`);
  return data;
}
