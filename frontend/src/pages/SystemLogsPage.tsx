import { useState } from 'react';
import { useAuditLogsQuery } from '@/features/audit-logs/hooks';
import { useAllAssignmentLogsQuery } from '@/features/repair-requests/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, UserCheck } from 'lucide-react';

type LogTab = 'audit' | 'assignment';

const actionVariantMap: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  created: 'success',
  updated: 'warning',
  deleted: 'destructive',
};

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState<LogTab>('audit');

  const { data: auditData, isLoading: auditLoading } = useAuditLogsQuery(1, 100);
  const { data: assignmentData, isLoading: assignmentLoading } = useAllAssignmentLogsQuery(1, 100);

  const auditLogs = auditData?.data ?? [];
  const assignmentLogs = assignmentData?.data ?? [];

  const tabs: { key: LogTab; label: string; icon: React.ReactNode }[] = [
    { key: 'audit', label: 'Audit Logs', icon: <FileText className="h-4 w-4" /> },
    { key: 'assignment', label: 'Assignment Logs', icon: <UserCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground">View all system activity logs</p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="gap-2"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Logs ({auditData?.meta.total ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>{log.actor.name}</TableCell>
                        <TableCell>
                          <Badge variant={actionVariantMap[log.action] ?? 'secondary'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.entityType}</TableCell>
                        <TableCell>#{log.entityId}</TableCell>
                        <TableCell className="max-w-xs">
                          {log.action === 'created' && log.newValue && (
                            <span className="text-xs text-muted-foreground">
                              {Object.entries(log.newValue).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </span>
                          )}
                          {log.action === 'updated' && log.oldValue && log.newValue && (
                            <span className="text-xs text-muted-foreground">
                              {Object.entries(log.oldValue).map(([k, v]) => {
                                const newVal = log.newValue?.[k];
                                return `${k}: ${v} → ${newVal}`;
                              }).join(', ')}
                            </span>
                          )}
                          {log.action === 'deleted' && (
                            <span className="text-xs text-muted-foreground">Record removed</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(log.loggedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Logs */}
      {activeTab === 'assignment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Assignment Logs ({assignmentData?.meta.total ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No assignment logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignmentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>#{log.requestId}</TableCell>
                        <TableCell>{log.actor.name}</TableCell>
                        <TableCell>{log.technician.name}</TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'assigned' ? 'success' : 'destructive'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(log.loggedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
