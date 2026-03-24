// TODO: Replace mock with real API when backend is ready
import { mockUsers } from '@/lib/mock-data';
import type { User } from '@/types';
import type { PaginatedResponse } from '@/types/api';

export async function getUsers(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
  return { data: mockUsers, message: 'Users retrieved', meta: { page, limit, total: mockUsers.length } };
}
