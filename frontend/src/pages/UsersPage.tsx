import { useState } from 'react';
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useOnboardUserMutation, useHrUpdateUserMutation } from '@/features/users/hooks';
import { useRolesQuery } from '@/features/roles/hooks';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import type { User } from '@/types';
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
import { Plus, Pencil, KeyRound, UserX, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

interface AdminCreateValues {
  name: string;
  email: string;
  roleId: string;
  deptId: string;
  password: string;
}

interface HrCreateValues {
  name: string;
  email: string;
  deptId: string;
  password: string;
}

const adminCreateSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  deptId: Yup.string().required('Department is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

const hrCreateSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  deptId: Yup.string().required('Department is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters'),
});

const adminEditSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  deptId: Yup.string().required('Department is required'),
});

const hrEditSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  deptId: Yup.string().required('Department is required'),
});

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { hasRole } = useAuthStore();

  const isAdmin = hasRole('admin');
  const { data: usersResponse, isLoading, isError } = useUsersQuery();
  const { data: rolesResponse } = useRolesQuery(1, 20, isAdmin);
  const { data: deptsResponse } = useDepartmentsQuery();
  const createMutation = useCreateUserMutation();
  const onboardMutation = useOnboardUserMutation();
  const updateMutation = useUpdateUserMutation();
  const hrUpdateMutation = useHrUpdateUserMutation();

  const users = usersResponse?.data ?? [];
  const canManageUsers = hasRole('admin', 'hr');

  const roleOptions = (rolesResponse?.data ?? []).map((r) => ({ value: String(r.id), label: r.name }));
  const deptOptions = (deptsResponse?.data ?? []).map((d) => ({ value: String(d.id), label: d.name }));

  if (isLoading) return <div className="flex items-center justify-center p-8">Loading users...</div>;
  if (isError) return <div className="flex items-center justify-center p-8 text-destructive">Failed to load users</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? 'User Management' : 'Employees'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage user accounts, roles and permissions' : 'Manage employee information'}
          </p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {isAdmin ? 'Add User' : 'Add Employee'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? `All Users (${users.length})` : `All Employees (${users.length})`}
          </CardTitle>
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
                {canManageUsers && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
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
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => { setSelectedUser(u); setEditDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reset Password"
                                onClick={() => { setSelectedUser(u); setResetDialogOpen(true); }}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={u.isActive ? 'Deactivate' : 'Activate'}
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: u.id,
                                    payload: { isActive: !u.isActive },
                                  })
                                }
                              >
                                {u.isActive
                                  ? <UserX className="h-4 w-4 text-destructive" />
                                  : <UserCheck className="h-4 w-4 text-emerald-600" />
                                }
                              </Button>
                            </>
                          )}
                        </div>
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
            <DialogTitle>{isAdmin ? 'Add User' : 'Add Employee'}</DialogTitle>
            <DialogDescription>
              {isAdmin ? 'Create a new user account with role assignment' : 'Add a new employee record'}
            </DialogDescription>
          </DialogHeader>
          {isAdmin ? (
            <Formik<AdminCreateValues>
              initialValues={{ name: '', email: '', roleId: '', deptId: '', password: '' }}
              validationSchema={adminCreateSchema}
              onSubmit={(values, { setSubmitting, resetForm }) => {
                createMutation.mutate(
                  {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    roleId: Number(values.roleId),
                    deptId: Number(values.deptId),
                  },
                  {
                    onSuccess: () => { resetForm(); setDialogOpen(false); },
                    onSettled: () => setSubmitting(false),
                  },
                );
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
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          ) : (
            <Formik<HrCreateValues>
              initialValues={{ name: '', email: '', deptId: '', password: '' }}
              validationSchema={hrCreateSchema}
              onSubmit={(values, { setSubmitting, resetForm }) => {
                onboardMutation.mutate(
                  {
                    name: values.name,
                    email: values.email,
                    deptId: Number(values.deptId),
                    password: values.password || undefined,
                  },
                  {
                    onSuccess: () => { resetForm(); setDialogOpen(false); },
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput name="name" label="Name" placeholder="Full name" />
                  <FormikInput name="email" label="Email" type="email" placeholder="user@company.com" />
                  <FormikInput name="password" label="Password (optional)" type="password" placeholder="Min 8 characters" />
                  <FormikSelect name="deptId" label="Department" placeholder="Select department..." options={deptOptions} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              {isAdmin ? 'Update account details and role' : 'Update employee information'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && isAdmin && (
            <Formik
              initialValues={{
                name: selectedUser.name,
                email: selectedUser.email,
                roleId: String(selectedUser.roleId),
                deptId: String(selectedUser.deptId),
              }}
              validationSchema={adminEditSchema}
              onSubmit={(values, { setSubmitting }) => {
                updateMutation.mutate(
                  {
                    id: selectedUser.id,
                    payload: {
                      name: values.name,
                      email: values.email,
                      roleId: Number(values.roleId),
                      deptId: Number(values.deptId),
                    },
                  },
                  {
                    onSuccess: () => { setEditDialogOpen(false); setSelectedUser(null); },
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput name="name" label="Name" placeholder="Full name" />
                  <FormikInput name="email" label="Email" type="email" placeholder="user@company.com" />
                  <FormikSelect name="roleId" label="Role" placeholder="Select role..." options={roleOptions} />
                  <FormikSelect name="deptId" label="Department" placeholder="Select department..." options={deptOptions} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
          {selectedUser && !isAdmin && (
            <Formik
              initialValues={{
                name: selectedUser.name,
                deptId: String(selectedUser.deptId),
              }}
              validationSchema={hrEditSchema}
              onSubmit={(values, { setSubmitting }) => {
                hrUpdateMutation.mutate(
                  {
                    id: selectedUser.id,
                    payload: {
                      name: values.name,
                      deptId: Number(values.deptId),
                    },
                  },
                  {
                    onSuccess: () => { setEditDialogOpen(false); setSelectedUser(null); },
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput name="name" label="Name" placeholder="Full name" />
                  <FormikSelect name="deptId" label="Department" placeholder="Select department..." options={deptOptions} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password dialog — admin only */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={Yup.object({
              newPassword: Yup.string().min(8, 'Min 8 characters').required('Required'),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword')], 'Passwords must match')
                .required('Required'),
            })}
            onSubmit={(values, { setSubmitting }) => {
              if (!selectedUser) return;
              updateMutation.mutate(
                {
                  id: selectedUser.id,
                  payload: { password: values.newPassword },
                },
                {
                  onSuccess: () => {
                    setResetDialogOpen(false);
                    setSelectedUser(null);
                  },
                  onSettled: () => setSubmitting(false),
                },
              );
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInput name="newPassword" label="New Password" type="password" placeholder="Min 8 characters" />
                <FormikInput name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
