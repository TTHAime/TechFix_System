import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import {
  useRepairRequestQuery,
  useCloseRepairRequestMutation,
  useConfirmRepairRequestMutation,
  useAcceptItemMutation,
  useAssignItemMutation,
  useUnassignItemMutation,
  useResolveItemMutation,
} from '@/features/repair-requests/hooks';
import { useUsersQuery } from '@/features/users/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, User, Monitor, Clock, Wrench, Hand, UserX } from 'lucide-react';
import type { RequestStatusName, RequestEquipment } from '@/types';

const statusVariantMap: Record<RequestStatusName, 'warning' | 'default' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary',
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();

  const isAdmin = hasRole('admin');
  const isTechnician = hasRole('technician');

  const { data: requestData, isLoading } = useRepairRequestQuery(Number(id));
  const { data: usersData } = useUsersQuery(1, 100, isAdmin);

  const closeMutation = useCloseRepairRequestMutation(Number(id));
  const confirmMutation = useConfirmRepairRequestMutation(Number(id));
  const acceptMutation = useAcceptItemMutation(Number(id));
  const assignMutation = useAssignItemMutation(Number(id));
  const unassignMutation = useUnassignItemMutation(Number(id));
  const resolveMutation = useResolveItemMutation(Number(id));

  if (isLoading) {
    return <p className="text-muted-foreground py-12 text-center">Loading...</p>;
  }

  const request = requestData?.data;

  if (!request) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Request not found.</p>
        <Button variant="outline" onClick={() => navigate('/requests')}>
          Back to Requests
        </Button>
      </div>
    );
  }

  const technicians = (usersData?.data ?? []).filter((u) => u.role.name === 'technician');
  const isClosed = request.status.name === 'closed';

  const assignmentEvents = request.assignmentLogs.map((log) => ({
    key: `assign-${log.id}`,
    color: 'bg-blue-500',
    label:
      log.actorId === log.technicianId
        ? `${log.technician.name} claimed ${log.item ? log.item.equipment.name : 'item'}`
        : `${log.action} ${log.technician.name}${log.item ? ` → ${log.item.equipment.name}` : ''}`,
    date: log.loggedAt,
  }));

  const isPending =
    acceptMutation.isPending ||
    assignMutation.isPending ||
    unassignMutation.isPending ||
    resolveMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Request #{request.id}</h1>
          <p className="text-sm text-muted-foreground">Created {new Date(request.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={statusVariantMap[request.status.name]} className="text-sm px-3 py-1">
          {request.status.name.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main details — equipment items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p>{request.description}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Equipment
              </p>
              <div className="space-y-3">
                {request.requestEquipment.map((item) => (
                  <EquipmentItemCard
                    key={`${item.requestId}-${item.seqNo}`}
                    item={item}
                    isClosed={isClosed}
                    isAdmin={isAdmin}
                    isTechnician={isTechnician}
                    currentUserId={user?.id}
                    technicians={technicians}
                    onAccept={(seqNo) => acceptMutation.mutate(seqNo)}
                    onAssign={(seqNo, technicianId) => assignMutation.mutate({ seqNo, technicianId })}
                    onUnassign={(seqNo) => unassignMutation.mutate(seqNo)}
                    onResolve={(seqNo, partsUsed, repairSummary, note) =>
                      resolveMutation.mutate({ seqNo, partsUsed, repairSummary, note })
                    }
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Requester */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Requester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{request.requester.name}</p>
              <p className="text-sm text-muted-foreground">{request.requester.email}</p>
              <p className="text-sm text-muted-foreground">{request.requester.department.name}</p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Created</span>
                <span className="ml-auto text-muted-foreground text-xs">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
              {assignmentEvents.map((ev) => (
                <div key={ev.key} className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${ev.color}`} />
                  <span className="flex-1 truncate">{ev.label}</span>
                  <span className="ml-auto text-muted-foreground text-xs shrink-0">
                    {new Date(ev.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {request.completedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>All items resolved</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {new Date(request.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin request-level actions */}
          {isAdmin && !isClosed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Actions</CardTitle>
                <CardDescription>Request-level controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status.name === 'resolved' && (
                  <Button
                    className="w-full"
                    size="sm"
                    variant="secondary"
                    disabled={closeMutation.isPending}
                    onClick={() => closeMutation.mutate()}
                  >
                    {closeMutation.isPending ? 'Closing...' : 'Force Close Request'}
                  </Button>
                )}
                {request.status.name !== 'resolved' && request.status.name !== 'closed' && (
                  <p className="text-xs text-muted-foreground">Assign/unassign items individually above.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* User confirm */}
          {request.status.name === 'resolved' && user?.id === request.requesterId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ยืนยันการซ่อม</CardTitle>
                <CardDescription>กรุณายืนยันว่าการซ่อมเสร็จสมบูรณ์</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate()}
                >
                  {confirmMutation.isPending ? 'กำลังยืนยัน...' : 'ยืนยันรับงานซ่อม'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EquipmentItemCard ────────────────────────────────────────────────────────

interface EquipmentItemCardProps {
  item: RequestEquipment;
  isClosed: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  currentUserId?: number;
  technicians: Array<{ id: number; name: string; role: { name: string } }>;
  onAccept: (seqNo: number) => void;
  onAssign: (seqNo: number, technicianId: number) => void;
  onUnassign: (seqNo: number) => void;
  onResolve: (seqNo: number, partsUsed?: string, repairSummary?: string, note?: string) => void;
  isPending: boolean;
}

function EquipmentItemCard({
  item,
  isClosed,
  isAdmin,
  isTechnician,
  currentUserId,
  technicians,
  onAccept,
  onAssign,
  onUnassign,
  onResolve,
  isPending,
}: EquipmentItemCardProps) {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [partsUsed, setPartsUsed] = useState('');
  const [repairSummary, setRepairSummary] = useState('');

  const isMyItem = isTechnician && item.technicianId === currentUserId;
  const itemStatusName = item.status.name as RequestStatusName;

  function handleResolve() {
    onResolve(item.seqNo, partsUsed || undefined, repairSummary || undefined);
    setShowResolveForm(false);
    setPartsUsed('');
    setRepairSummary('');
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">#{item.seqNo}</span>
          <p className="font-medium">{item.equipment.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{item.equipment.serialNo}</span>
          <Badge variant={statusVariantMap[itemStatusName]} className="text-xs">
            {itemStatusName.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Issue detail */}
      <p className="text-sm text-muted-foreground">{item.issueDetail}</p>

      {/* Category / Dept badges */}
      <div className="flex gap-2">
        <Badge variant="outline">{item.equipment.category.name}</Badge>
        <Badge variant="secondary">{item.equipment.department.name}</Badge>
      </div>

      {/* Technician info */}
      {item.technician && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Technician:</span> {item.technician.name}
          {item.resolvedAt && (
            <span className="ml-2 text-emerald-600">
              · Resolved {new Date(item.resolvedAt).toLocaleDateString()}
            </span>
          )}
        </p>
      )}

      {/* Repair info (shown once resolved) */}
      {(item.partsUsed || item.repairSummary) && (
        <div className="rounded-sm bg-muted px-2 py-1.5 space-y-0.5">
          <p className="text-xs flex items-center gap-1 text-muted-foreground font-medium">
            <Wrench className="h-3 w-3" /> Repair Info
          </p>
          {item.repairSummary && <p className="text-xs">{item.repairSummary}</p>}
          {item.partsUsed && (
            <p className="text-xs text-muted-foreground">Parts: {item.partsUsed}</p>
          )}
        </div>
      )}

      {/* Actions — only when not closed */}
      {!isClosed && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Technician: accept open item */}
          {isTechnician && itemStatusName === 'open' && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => onAccept(item.seqNo)}>
              <Hand className="mr-1 h-3 w-3" />
              Accept
            </Button>
          )}

          {/* Technician: resolve own in-progress item */}
          {isMyItem && itemStatusName === 'in_progress' && !showResolveForm && (
            <Button size="sm" disabled={isPending} onClick={() => setShowResolveForm(true)}>
              Mark Resolved
            </Button>
          )}

          {/* Admin: assign open item to technician */}
          {isAdmin && itemStatusName === 'open' && (
            <div className="flex flex-wrap gap-1">
              {technicians.map((tech) => (
                <Button
                  key={tech.id}
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => onAssign(item.seqNo, tech.id)}
                  className="text-xs"
                >
                  Assign {tech.name}
                </Button>
              ))}
            </div>
          )}

          {/* Admin: unassign in-progress item */}
          {isAdmin && itemStatusName === 'in_progress' && (
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => onUnassign(item.seqNo)}>
              <UserX className="mr-1 h-3 w-3" />
              Unassign
            </Button>
          )}
        </div>
      )}

      {/* Resolve inline form */}
      {showResolveForm && (
        <div className="rounded-sm border bg-muted/40 p-3 space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`parts-${item.seqNo}`} className="text-xs">
              Parts Used
            </Label>
            <Input
              id={`parts-${item.seqNo}`}
              placeholder="e.g. RAM 8GB, Power supply"
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`summary-${item.seqNo}`} className="text-xs">
              Repair Summary
            </Label>
            <Textarea
              id={`summary-${item.seqNo}`}
              placeholder="Describe what was done..."
              value={repairSummary}
              onChange={(e) => setRepairSummary(e.target.value)}
              className="text-sm min-h-16 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending} onClick={handleResolve}>
              {isPending ? 'Saving...' : 'Confirm Resolved'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowResolveForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
