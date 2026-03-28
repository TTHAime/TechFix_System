import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useRepairRequestsQuery } from '@/features/repair-requests/hooks';
import { assignTechnician } from '@/features/repair-requests/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Hand, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { RequestStatusName, RepairRequest } from '@/types';

const statusVariantMap: Record<RequestStatusName, 'warning' | 'default' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary',
};

export default function RequestListPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatusName | 'all'>('all');

  const { data: response, isLoading, isError } = useRepairRequestsQuery(page, 20);
  const queryClient = useQueryClient();
  const assignMutation = useMutation({
    mutationFn: ({ id, technicianId }: { id: number; technicianId: number }) =>
      assignTechnician(id, technicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
    },
  });

  if (!user) return null;

  const allRequests = response?.data ?? [];
  const meta = response?.meta;

  // Filter by role (client-side — backend already filters by role via guard)
  let requests = allRequests;

  // Filter by status
  if (statusFilter !== 'all') {
    requests = requests.filter((r) => r.status.name === statusFilter);
  }

  const isAssignedToMe = (req: RepairRequest) =>
    req.assignmentLogs.some((a) => a.technicianId === user.id && a.action === 'assigned');

  const isClaimable = (req: RepairRequest) =>
    hasRole('technician') && req.status.name === 'open' && req.assignmentLogs.length === 0;

  const handleClaim = (reqId: number) => {
    assignMutation.mutate({ id: reqId, technicianId: user.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repair Requests</h1>
          <p className="text-muted-foreground">
            {hasRole('user') ? 'Your submitted requests' : hasRole('technician') ? 'Your repairs & open requests' : 'All repair requests'}
          </p>
        </div>
        {hasRole('user', 'admin') && (
          <Button onClick={() => navigate('/requests/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests {meta ? `(${meta.total})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center text-destructive py-8">
              Failed to load requests. Please try again.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Equipment</TableHead>
                    {!hasRole('user') && <TableHead>Requester</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    {hasRole('technician') && <TableHead className="w-24">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/requests/${req.id}`)}
                    >
                      <TableCell className="font-medium">#{req.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{req.description}</TableCell>
                      <TableCell>{req.requestEquipment.map((e) => e.equipment.name).join(', ')}</TableCell>
                      {!hasRole('user') && <TableCell>{req.requester.name}</TableCell>}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariantMap[req.status.name]}>
                            {req.status.name.replace('_', ' ')}
                          </Badge>
                          {hasRole('technician') && isAssignedToMe(req) && (
                            <Badge variant="outline" className="text-xs">mine</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      {hasRole('technician') && (
                        <TableCell>
                          {isClaimable(req) && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={assignMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaim(req.id);
                              }}
                            >
                              <Hand className="mr-1 h-3 w-3" />
                              Claim
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.total > meta.limit && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {Math.ceil(meta.total / meta.limit)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= Math.ceil(meta.total / meta.limit)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
