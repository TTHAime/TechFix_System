import { axiosInstance } from '@/lib/axios';
import type { AuditLog } from '@/types';
import type { PaginatedResponse } from '@/types/api';

export async function getAuditLogs(page = 1, limit = 20): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await axiosInstance.get<PaginatedResponse<AuditLog>>('/audit-logs', {
    params: { page, limit },
  });
  return data;
}
