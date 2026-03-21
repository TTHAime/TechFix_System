import { useState } from 'react';
import { mockUsers, mockRoles, mockDepartments } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormikInput } from '@/components/ui/FormikInput';
import { FormikSelect } from '@/components/ui/FormikSelect';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Pencil } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

interface UserFormValues {
  name: string;
  email: string;
  roleId: string;
  deptId: string;
  password: string;
}

const userSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  deptId: Yup.string().required('Department is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasRole } = useAuthStore();

  const roleOptions = mockRoles.map((r) => ({ value: String(r.id), label: r.name }));
  const deptOptions = mockDepartments.map((d) => ({ value: String(d.id), label: d.name }));

  const initialValues: UserFormValues = { name: '', email: '', roleId: '', deptId: '', password: '' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        {hasRole('admin') && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({mockUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {hasRole('admin') && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => {
                const initials = u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{u.role.name}</Badge>
                    </TableCell>
                    <TableCell>{u.department.name}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'success' : 'destructive'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {hasRole('admin') && (
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <Formik<UserFormValues>
            initialValues={initialValues}
            validationSchema={userSchema}
            onSubmit={(_values, { setSubmitting }) => {
              setTimeout(() => {
                setSubmitting(false);
                setDialogOpen(false);
              }, 500);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInput name="name" label="Name" placeholder="Full name" />
                <FormikInput name="email" label="Email" type="email" placeholder="user@company.com" />
                <FormikInput name="password" label="Password" type="password" placeholder="Min 8 characters" />
                <FormikSelect name="roleId" label="Role" placeholder="Select role..." options={roleOptions} />
                <FormikSelect name="deptId" label="Department" placeholder="Select department..." options={deptOptions} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </div>
  );
}
