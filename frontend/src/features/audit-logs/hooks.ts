import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from './api';

export function useAuditLogsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['audit-logs', page, limit],
    queryFn: () => getAuditLogs(page, limit),
  });
}
