import { axiosInstance } from '@/lib/axios';
import type { User } from '@/types';
import type { ApiResponse } from '@/types/api';

interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function refreshTokenApi(): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/refresh');
  return data;
}

export async function logoutApi(): Promise<void> {
  await axiosInstance.post('/auth/logout');
}

export async function forceChangePasswordApi(
  newPassword: string,
): Promise<void> {
  await axiosInstance.post('/auth/force-change-password', { newPassword });
}

export async function getMeApi(): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.get<ApiResponse<User>>('/auth/me');
  return data;
}
