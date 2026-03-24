import { useQuery } from '@tanstack/react-query';
import { getRepairRequests } from './api';

export function useRepairRequestsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['repair-requests', page, limit],
    queryFn: () => getRepairRequests(page, limit),
  });
}
