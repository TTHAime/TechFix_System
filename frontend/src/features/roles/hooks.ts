import { useQuery } from '@tanstack/react-query';
import { getRoles } from './api';

export function useRolesQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['roles', page, limit],
    queryFn: () => getRoles(page, limit),
  });
}
