import { axiosInstance } from '@/lib/axios';
import type { User } from '@/types';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

export async function getUsers(
  page = 1,
  limit = 20,
  includeInactive = false,
): Promise<PaginatedResponse<User>> {
  const { data } = await axiosInstance.get<PaginatedResponse<User>>('/users', {
    params: { page, limit, ...(includeInactive && { includeInactive: 'true' }) },
  });
  return data;
}

export async function getUserById(id: number): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
  return data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  roleId: number;
  deptId: number;
}): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.post<ApiResponse<User>>('/users', {
    ...payload,
    provider: 'local',
  });
  return data;
}

export async function onboardUser(payload: {
  name: string;
  email: string;
  deptId: number;
  password?: string;
}): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.post<ApiResponse<User>>(
    '/users/onboard',
    {
      ...payload,
      provider: 'local',
    },
  );
  return data;
}

export async function updateUser(
  id: number,
  payload: {
    name?: string;
    email?: string;
    roleId?: number;
    deptId?: number;
    isActive?: boolean;
    password?: string;
  },
): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${id}`,
    payload,
  );
  return data;
}

export async function hrUpdateUser(
  id: number,
  payload: {
    name?: string;
    deptId?: number;
    isActive?: boolean;
    password?: string;
  },
): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(
    `/users/${id}/profile`,
    payload,
  );
  return data;
}

export async function deleteUser(id: number): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.delete<ApiResponse<User>>(
    `/users/${id}`,
  );
  return data;
}

export async function generatePassword(): Promise<ApiResponse<string>> {
  const { data } = await axiosInstance.get<ApiResponse<string>>(
    '/users/generate-password',
  );
  return data;
}

export async function exportPendingPasswordExcel(): Promise<Blob> {
  const { data } = await axiosInstance.get('/users/export-pending-password', {
    responseType: 'blob',
  });
  return data as Blob;
}
