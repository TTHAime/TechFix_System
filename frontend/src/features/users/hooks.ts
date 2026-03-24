import { useQuery } from '@tanstack/react-query';
import { getUsers } from './api';

export function useUsersQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => getUsers(page, limit),
  });
}
