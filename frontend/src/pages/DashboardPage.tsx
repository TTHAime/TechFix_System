import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useAdminDashboardQuery,
  useTechnicianDashboardQuery,
  useHrDashboardQuery,
  useUserDashboardQuery,
  useExportRepairRequestsMutation,
  useExportEquipmentMutation,
  useExportMyTasksMutation,
  useExportUsersMutation,
  useExportMyRequestsMutation,
} from '@/features/reports/hooks';
import type { ReportFilter } from '@/features/reports/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Building2,
  TrendingUp,
  Timer,
  ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6b7280', '#ef4444', '#8b5cf6'];

function StatusBadgeVariant(status: string): 'warning' | 'default' | 'success' | 'secondary' {
  const lower = status.toLowerCase();
  if (lower === 'open') return 'warning';
  if (lower === 'in_progress' || lower === 'in progress') return 'default';
  if (lower === 'resolved') return 'success';
  return 'secondary';
}

// ─── Admin Dashboard ──────────────────────────────────────────────

function AdminDashboard({ filter }: { filter: ReportFilter }) {
  const { data, isLoading } = useAdminDashboardQuery(filter);
  const exportRequests = useExportRepairRequestsMutation();
  const exportEquipment = useExportEquipmentMutation();
  const navigate = useNavigate();
  const dashboard = data?.data;

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return null;

  return (
    <>
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalRequests}</div>
            <p className="text-xs text-muted-foreground">All repair requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.avgResolutionHours}h</div>
            <p className="text-xs text-muted-foreground">Average resolution time</p>
          </CardContent>
        </Card>

        {dashboard.byStatus.slice(0, 2).map((s) => (
          <Card key={s.status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.status}</CardTitle>
              {s.status.toLowerCase() === 'open' ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <Clock className="h-4 w-4 text-blue-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.count}</div>
              <p className="text-xs text-muted-foreground">requests</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboard.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {dashboard.byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly trend line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboard.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By department bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Requests by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.byDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboard.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Top 5 Most Repaired Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.topEquipment.length > 0 ? (
              <div className="space-y-3">
                {dashboard.topEquipment.map((eq, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{eq.name}</p>
                      <p className="text-xs text-muted-foreground">{eq.serialNo}</p>
                    </div>
                    <Badge variant="secondary">{eq.count} repairs</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => exportRequests.mutate(filter)}
            disabled={exportRequests.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportRequests.isPending ? 'Exporting...' : 'Repair Requests'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportEquipment.mutate(filter)}
            disabled={exportEquipment.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportEquipment.isPending ? 'Exporting...' : 'Equipment'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Technician Dashboard ─────────────────────────────────────────

function TechDashboard({ filter }: { filter: ReportFilter }) {
  const { data, isLoading } = useTechnicianDashboardQuery(filter);
  const exportTasks = useExportMyTasksMutation();
  const dashboard = data?.data;

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Total assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.totalAssigned - dashboard.completedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">Still in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Tasks by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboard.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {dashboard.byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No assigned tasks</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => exportTasks.mutate()}
            disabled={exportTasks.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportTasks.isPending ? 'Exporting...' : 'My Tasks (Excel)'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ─── HR Dashboard ─────────────────────────────────────────────────

function HrDashboardView({ filter }: { filter: ReportFilter }) {
  const { data, isLoading } = useHrDashboardQuery(filter);
  const exportUsersMut = useExportUsersMutation();
  const dashboard = data?.data;

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Users by department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.usersByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboard.usersByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Requests by department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Repair Requests by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.requestsByDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dashboard.requestsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => exportUsersMut.mutate(filter)}
            disabled={exportUsersMut.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportUsersMut.isPending ? 'Exporting...' : 'Users (Excel)'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────

function UserDashboardView({ filter }: { filter: ReportFilter }) {
  const { data, isLoading } = useUserDashboardQuery(filter);
  const exportRequests = useExportMyRequestsMutation();
  const navigate = useNavigate();
  const dashboard = data?.data;

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/requests')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalRequests}</div>
            <p className="text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>

        {dashboard.byStatus.map((s) => (
          <Card key={s.status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.status}</CardTitle>
              <Badge variant={StatusBadgeVariant(s.status)} className="text-xs">
                {s.count}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.equipment.join(', ')} &middot; {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={StatusBadgeVariant(req.status)}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => exportRequests.mutate()}
            disabled={exportRequests.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportRequests.isPending ? 'Exporting...' : 'My Requests (Excel)'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Date filter bar ──────────────────────────────────────────────

function DateFilterBar({
  filter,
  onChange,
}: {
  filter: ReportFilter;
  onChange: (f: ReportFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label htmlFor="startDate" className="text-xs">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={filter.startDate ?? ''}
          onChange={(e) => onChange({ ...filter, startDate: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="endDate" className="text-xs">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={filter.endDate ?? ''}
          onChange={(e) => onChange({ ...filter, endDate: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      {(filter.startDate || filter.endDate) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear
        </Button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [filter, setFilter] = useState<ReportFilter>({});

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <DateFilterBar filter={filter} onChange={setFilter} />
      </div>

      {hasRole('admin') && <AdminDashboard filter={filter} />}
      {hasRole('technician') && <TechDashboard filter={filter} />}
      {hasRole('hr') && <HrDashboardView filter={filter} />}
      {hasRole('user') && <UserDashboardView filter={filter} />}
    </div>
  );
}
