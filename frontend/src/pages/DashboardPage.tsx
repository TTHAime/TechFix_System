import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRepairRequestsQuery } from '@/features/repair-requests/hooks';
import { useUsersQuery } from '@/features/users/hooks';
import { useEquipmentQuery } from '@/features/equipment/hooks';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { useAuditLogsQuery } from '@/features/audit-logs/hooks';
import {
  Wrench,
  Monitor,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ScrollText,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { RequestStatusName } from '@/types';

function StatusIcon({ status }: { status: RequestStatusName }) {
  switch (status) {
    case 'open': return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
    case 'resolved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'closed': return <XCircle className="h-4 w-4 text-gray-400" />;
    default: return null;
  }
}

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();

  // Backend already filters requests by role — no client-side filtering needed
  const { data: requestsData } = useRepairRequestsQuery(1, 100);
  const { data: usersData } = useUsersQuery(1, 100);
  const { data: equipmentData } = useEquipmentQuery(1, 1);
  const { data: departmentsData } = useDepartmentsQuery(1, 1);
  const { data: auditLogsData } = useAuditLogsQuery(1, 1);

  if (!user) return null;

  const requests = requestsData?.data ?? [];
  const openCount = requests.filter((r) => r.status.name === 'open').length;
  const inProgressCount = requests.filter((r) => r.status.name === 'in_progress').length;
  const resolvedCount = requests.filter((r) => r.status.name === 'resolved').length;

  const totalUsers = usersData?.meta.total ?? 0;
  const activeUsers = usersData?.data.filter((u) => u.isActive).length ?? 0;
  const totalEquipment = equipmentData?.meta.total ?? 0;
  const totalDepartments = departmentsData?.meta.total ?? 0;
  const totalAuditLogs = auditLogsData?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Admin: system overview stats */}
        {hasRole('admin') && (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/users')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">{activeUsers} active</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/equipment')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEquipment}</div>
                <p className="text-xs text-muted-foreground">Registered items</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/logs')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
                <ScrollText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAuditLogs}</div>
                <p className="text-xs text-muted-foreground">System activities</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* HR: employee/department stats */}
        {hasRole('hr') && (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/users')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">{activeUsers} active</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/departments')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDepartments}</div>
                <p className="text-xs text-muted-foreground">Active departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">System roles</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openCount}</div>
                <p className="text-xs text-muted-foreground">Employee requests</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Technician: repair-focused stats */}
        {hasRole('technician') && (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">Total assigned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedCount}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* User: own request stats */}
        {hasRole('user') && (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Requests</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">Total submitted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedCount}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {hasRole('user') ? 'My Recent Requests'
              : hasRole('technician') ? 'My Assigned Repairs'
                : hasRole('hr') ? 'Recent Employee Requests'
                  : 'Recent Repair Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No repair requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <StatusIcon status={req.status.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.requester.name} &middot; {req.requestEquipment.map((e) => e.equipment.name).join(', ')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      req.status.name === 'open' ? 'warning'
                        : req.status.name === 'in_progress' ? 'default'
                          : req.status.name === 'resolved' ? 'success'
                            : 'secondary'
                    }
                  >
                    {req.status.name.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
