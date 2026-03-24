import { axiosInstance } from '@/lib/axios';
import type { Role } from '@/types';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getRoles(page = 1, limit = 20): Promise<PaginatedResponse<Role>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Role>>('/roles', {
    params: { page, limit },
  });
  return data;
}

export async function getRoleById(id: number): Promise<ApiResponse<Role>> {
  const { data } = await axiosInstance.get<ApiResponse<Role>>(`/roles/${id}`);
  return data;
}

export async function createRole(name: string): Promise<ApiResponse<Role>> {
  const { data } = await axiosInstance.post<ApiResponse<Role>>('/roles', { name });
  return data;
}

export async function updateRole(id: number, name: string): Promise<ApiResponse<Role>> {
  const { data } = await axiosInstance.patch<ApiResponse<Role>>(`/roles/${id}`, { name });
  return data;
}

export async function deleteRole(id: number): Promise<ApiResponse<Role>> {
  const { data } = await axiosInstance.delete<ApiResponse<Role>>(`/roles/${id}`);
  return data;
}
