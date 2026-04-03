import { useRolesQuery } from '@/features/roles/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const roleBadgeVariant: Record<string, 'destructive' | 'default' | 'warning' | 'secondary'> = {
  admin: 'destructive',
  hr: 'default',
  technician: 'warning',
};

const roleDescriptions: Record<string, { label: string; permissions: string[] }> = {
  admin: {
    label: 'System Administrator',
    permissions: [
      'Manage user accounts (create/edit/deactivate)',
      'Assign roles & permissions',
      'Reset passwords',
      'View system logs (Audit, Status, Assignment)',
      'Manage equipment & departments',
      'Assign repair requests to technicians',
    ],
  },
  hr: {
    label: 'Human Resources',
    permissions: [
      'Add/edit employee information',
      'Manage departments & positions',
      'Manage employee status (active/inactive)',
      'View all employee requests',
      'View HR dashboard & reports',
    ],
  },
  technician: {
    label: 'Technician',
    permissions: [
      'View assigned repair requests',
      'Update repair request status',
      'Add repair notes & parts used',
      'View equipment inventory',
    ],
  },
  user: {
    label: 'Employee',
    permissions: [
      'Submit repair requests',
      'Track own request status',
      'View own request history',
    ],
  },
};

export default function RolesPage() {
  const { data: response, isLoading, isError } = useRolesQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading roles...</div>;
  }

  if (isError) {
    return <div className="flex items-center justify-center p-8 text-destructive">Failed to load roles</div>;
  }

  const roles = response?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">System role definitions and access levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Roles ({roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-32">Name</TableHead>
                <TableHead className="w-48">Access Level</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const desc = roleDescriptions[role.name];
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.id}</TableCell>
                    <TableCell className="font-medium capitalize">{role.name}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[role.name] ?? 'secondary'}>
                        {desc?.label ?? role.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {desc && (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {desc.permissions.map((p) => (
                            <li key={p} className="flex items-start gap-2">
                              <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
