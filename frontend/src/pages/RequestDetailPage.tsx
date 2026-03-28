import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useRepairRequestQuery, useAssignTechnicianMutation, useUpdateRepairRequestMutation, useCloseRepairRequestMutation } from '@/features/repair-requests/hooks';
import { useUsersQuery } from '@/features/users/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Monitor, Clock, Wrench, Hand } from 'lucide-react';
import type { RequestStatusName } from '@/types';

const STATUS_IDS: Record<string, number> = {
  in_progress: 2,
  resolved: 3,
};

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
  const { data: requestData, isLoading } = useRepairRequestQuery(Number(id));
  const { data: usersData } = useUsersQuery(1, 100, isAdmin);

  const assignMutation = useAssignTechnicianMutation(Number(id));
  const updateMutation = useUpdateRepairRequestMutation(Number(id));
  const closeMutation = useCloseRepairRequestMutation(Number(id));

  if (isLoading) {
    return <p className="text-muted-foreground py-12 text-center">Loading...</p>;
  }

  const request = requestData?.data;

  if (!request) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Request not found.</p>
        <Button variant="outline" onClick={() => navigate('/requests')}>Back to Requests</Button>
      </div>
    );
  }

  const assignedTech = request.assignmentLogs.find((a) => a.action === 'assigned')?.technician;
  const technicians = (usersData?.data ?? []).filter((u) => u.role.name === 'technician');
  const isUnassigned = request.status.name === 'open' && request.assignmentLogs.length === 0;
  const isMyRequest = hasRole('technician') && assignedTech?.id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Request #{request.id}</h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant={statusVariantMap[request.status.name]} className="text-sm px-3 py-1">
          {request.status.name.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main details */}
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
              {request.requestEquipment.map((re) => (
                <div key={re.id} className="rounded-md border p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{re.equipment.name}</p>
                    <span className="text-xs text-muted-foreground">{re.equipment.serialNo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{re.issueDetail}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{re.equipment.category.name}</Badge>
                    <Badge variant="secondary">{re.equipment.department.name}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {request.repairSummary && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Repair Summary
                  </p>
                  <p>{request.repairSummary}</p>
                  {request.partsUsed && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Parts used:</span> {request.partsUsed}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar info */}
        <div className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Assigned Technician
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedTech ? (
                <div>
                  <p className="font-medium">{assignedTech.name}</p>
                  <p className="text-sm text-muted-foreground">{assignedTech.email}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}

              {/* Technician can claim unassigned requests */}
              {hasRole('technician') && isUnassigned && user && (
                <Button
                  className="w-full mt-3"
                  size="sm"
                  disabled={assignMutation.isPending}
                  onClick={() => assignMutation.mutate(user.id)}
                >
                  <Hand className="mr-2 h-4 w-4" />
                  {assignMutation.isPending ? 'Claiming...' : 'Claim This Request'}
                </Button>
              )}

              {/* Admin can assign technician */}
              {hasRole('admin') && isUnassigned && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Assign to:</p>
                  {technicians.map((tech) => (
                    <Button
                      key={tech.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate(tech.id)}
                    >
                      {tech.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
              {request.assignmentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>
                    {log.actorId === log.technicianId
                      ? `${log.technician.name} claimed`
                      : `${log.action} to ${log.technician.name}`}
                  </span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {new Date(log.loggedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {request.completedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Completed</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {new Date(request.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status actions */}
          {hasRole('admin', 'technician') && request.status.name !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
                <CardDescription>Update request status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status.name === 'open' && hasRole('admin') && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ statusId: STATUS_IDS.in_progress })}
                  >
                    Mark In Progress
                  </Button>
                )}
                {request.status.name === 'in_progress' && (hasRole('admin') || isMyRequest) && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        statusId: STATUS_IDS.resolved,
                        completedAt: new Date().toISOString(),
                      })
                    }
                  >
                    Mark Resolved
                  </Button>
                )}
                {request.status.name === 'resolved' && hasRole('admin') && (
                  <Button
                    className="w-full"
                    size="sm"
                    variant="secondary"
                    disabled={closeMutation.isPending}
                    onClick={() => closeMutation.mutate()}
                  >
                    {closeMutation.isPending ? 'Closing...' : 'Close Request'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
