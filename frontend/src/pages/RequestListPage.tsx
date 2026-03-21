import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useRepairRequestStore } from '@/stores/repair-requests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Hand } from 'lucide-react';
import type { RequestStatusName } from '@/types';

const statusVariantMap: Record<RequestStatusName, 'warning' | 'default' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary',
};

export default function RequestListPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const { requests: allRequests, claimRequest } = useRepairRequestStore();
  const [statusFilter, setStatusFilter] = useState<RequestStatusName | 'all'>('all');

  if (!user) return null;

  // Filter by role
  let requests = hasRole('user')
    ? allRequests.filter((r) => r.requesterId === user.id)
    : hasRole('technician')
      ? allRequests.filter((r) =>
          // Show assigned to me OR open & unassigned (claimable)
          r.assignmentLogs.some((a) => a.technicianId === user.id && a.action === 'assigned')
          || (r.status.name === 'open' && r.assignmentLogs.length === 0),
        )
      : allRequests;

  // Filter by status
  if (statusFilter !== 'all') {
    requests = requests.filter((r) => r.status.name === statusFilter);
  }

  const isAssignedToMe = (req: typeof allRequests[0]) =>
    req.assignmentLogs.some((a) => a.technicianId === user.id && a.action === 'assigned');

  const isClaimable = (req: typeof allRequests[0]) =>
    hasRole('technician') && req.status.name === 'open' && req.assignmentLogs.length === 0;

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
          <CardTitle>Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            claimRequest(req.id, user.id);
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
        </CardContent>
      </Card>
    </div>
  );
}
