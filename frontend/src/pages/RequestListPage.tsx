import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useRepairRequestsQuery, useAcceptItemMutation } from '@/features/repair-requests/hooks';
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

  if (!user) return null;

  const allRequests = response?.data ?? [];
  const meta = response?.meta;

  const requests = statusFilter !== 'all' ? allRequests.filter((r) => r.status.name === statusFilter) : allRequests;

  // Technician is assigned to me if any item has technicianId === me
  const isAssignedToMe = (req: RepairRequest) =>
    req.requestEquipment.some((item) => item.technicianId === user.id);

  // Items in a request that are still open (technician can claim)
  const claimableItems = (req: RepairRequest) =>
    hasRole('technician') ? req.requestEquipment.filter((item) => item.status.name === 'open') : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repair Requests</h1>
          <p className="text-muted-foreground">
            {hasRole('user')
              ? 'Your submitted requests'
              : hasRole('technician')
                ? 'Your repairs & open requests'
                : 'All repair requests'}
          </p>
        </div>
        {hasRole('user', 'admin', 'hr') && (
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
            <div className="text-center text-destructive py-8">Failed to load requests. Please try again.</div>
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
                    {hasRole('technician') && <TableHead className="w-32">Items to Claim</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <RequestRow
                      key={req.id}
                      req={req}
                      userId={user.id}
                      isAdmin={hasRole('admin')}
                      isTechnician={hasRole('technician')}
                      isUser={hasRole('user')}
                      isAssignedToMe={isAssignedToMe(req)}
                      claimableItems={claimableItems(req)}
                      onRowClick={() => navigate(`/requests/${req.id}`)}
                    />
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
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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

// ─── Sub-component: one row ───────────────────────────────────────────────────

interface RequestRowProps {
  req: RepairRequest;
  userId: number;
  isAdmin: boolean;
  isTechnician: boolean;
  isUser: boolean;
  isAssignedToMe: boolean;
  claimableItems: RepairRequest['requestEquipment'];
  onRowClick: () => void;
}

function RequestRow({
  req,
  isTechnician,
  isUser,
  isAssignedToMe,
  claimableItems,
  onRowClick,
}: RequestRowProps) {
  const acceptMutation = useAcceptItemMutation(req.id);

  return (
    <TableRow className="cursor-pointer" onClick={onRowClick}>
      <TableCell className="font-medium">#{req.id}</TableCell>
      <TableCell className="max-w-xs truncate">{req.description}</TableCell>
      <TableCell>{req.requestEquipment.map((e) => e.equipment.name).join(', ')}</TableCell>
      {!isUser && <TableCell>{req.requester.name}</TableCell>}
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariantMap[req.status.name]}>{req.status.name.replace('_', ' ')}</Badge>
          {isTechnician && isAssignedToMe && (
            <Badge variant="outline" className="text-xs">
              mine
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
      {isTechnician && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          {claimableItems.length > 0 && (
            <div className="flex flex-col gap-1">
              {claimableItems.map((item) => (
                <Button
                  key={`${item.requestId}-${item.seqNo}`}
                  size="sm"
                  variant="outline"
                  disabled={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate(item.seqNo)}
                  className="text-xs justify-start"
                >
                  <Hand className="mr-1 h-3 w-3" />
                  {item.equipment.name}
                </Button>
              ))}
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
