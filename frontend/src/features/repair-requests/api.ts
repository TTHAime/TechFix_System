// TODO: Replace mock with real API when backend is ready
import { mockRepairRequests } from '@/lib/mock-data';
import type { RepairRequest } from '@/types';
import type { PaginatedResponse } from '@/types/api';

export async function getRepairRequests(page = 1, limit = 20): Promise<PaginatedResponse<RepairRequest>> {
  return { data: mockRepairRequests, message: 'Requests retrieved', meta: { page, limit, total: mockRepairRequests.length } };
}
