import { useState } from 'react';
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useOnboardUserMutation,
  useHrUpdateUserMutation,
} from '@/features/users/hooks';
import { useRolesQuery } from '@/features/roles/hooks';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormikInput } from '@/components/ui/FormikInput';
import { FormikSelect } from '@/components/ui/FormikSelect';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Wand2,
  Download,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import {
  generatePassword as generatePasswordApi,
  exportPendingPasswordExcel,
} from '@/features/users/api';
import { usePendingCredentialsStore } from '@/stores/pending-credentials';
import { exportCredentialsToExcel } from '@/lib/export-credentials';
import { Pagination } from '@/components/common/Pagination';

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

const safeTextPattern = /^[^<>"';{}()|\\]*$/;

const strongPasswordSchema = Yup.string()
  .min(15, 'Password must be at least 15 characters')
  .max(64, 'Password must not exceed 64 characters')
  .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
  .matches(/[a-z]/, 'Must contain at least one lowercase letter')
  .matches(/[0-9]/, 'Must contain at least one number')
  .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character')
  .required('Password is required');

const adminCreateSchema = Yup.object({
  name: Yup.string()
    .matches(safeTextPattern, 'Name contains invalid characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  deptId: Yup.string().required('Department is required'),
  password: strongPasswordSchema,
});

const hrCreateSchema = Yup.object({
  name: Yup.string()
    .matches(safeTextPattern, 'Name contains invalid characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .required('Email is required'),
  deptId: Yup.string().required('Department is required'),
  password: Yup.string()
    .min(15, 'Password must be at least 15 characters')
    .max(64, 'Password must not exceed 64 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});

const adminEditSchema = Yup.object({
  name: Yup.string()
    .matches(safeTextPattern, 'Name contains invalid characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .required('Email is required'),
  roleId: Yup.string().required('Role is required'),
  deptId: Yup.string().required('Department is required'),
});

const hrEditSchema = Yup.object({
  name: Yup.string()
    .matches(safeTextPattern, 'Name contains invalid characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Name is required'),
  deptId: Yup.string().required('Department is required'),
});

const resetPasswordSchema = Yup.object({
  newPassword: strongPasswordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm the password'),
});


function getDeactivateInfo(user: User | null, isPending: boolean) {
  const active = user?.isActive;
  const actionLabel = active ? 'Deactivate' : 'Activate';
  const pendingLabel = active ? 'Deactivating...' : 'Activating...';
  return {
    buttonLabel: isPending ? pendingLabel : actionLabel,
    toastMsg: active
      ? `${user?.name} has been deactivated`
      : `${user?.name} has been activated`,
    dialogDesc: active
      ? `Are you sure you want to deactivate "${user?.name}"? They will no longer be able to log in.`
      : `Are you sure you want to reactivate "${user?.name}"? They will be able to log in again.`,
  };
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { hasRole } = useAuthStore();
  const {
    credentials: pendingCredentials,
    add: addCredential,
    clear: clearCredentials,
  } = usePendingCredentialsStore();

  const isAdmin = hasRole('admin');
  const { data: usersResponse, isLoading, isError } = useUsersQuery(page, 20, isAdmin && showInactive);
  const { data: rolesResponse } = useRolesQuery(1, 20, isAdmin);
  const { data: deptsResponse } = useDepartmentsQuery();
  const createMutation = useCreateUserMutation();
  const onboardMutation = useOnboardUserMutation();
  const updateMutation = useUpdateUserMutation();
  const hrUpdateMutation = useHrUpdateUserMutation();

  const users = usersResponse?.data ?? [];
  const canManageUsers = hasRole('admin', 'hr');

  const roleOptions = (rolesResponse?.data ?? []).map((r) => ({
    value: String(r.id),
    label: r.name,
  }));
  const deptOptions = (deptsResponse?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-8">
        Loading users...
      </div>
    );
  if (isError)
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Failed to load users
      </div>
    );

  const { buttonLabel: deactivateButtonLabel, toastMsg: deactivateToastMsg, dialogDesc: deactivateDialogDesc } =
    getDeactivateInfo(selectedUser, hrUpdateMutation.isPending);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {isAdmin ? 'User Management' : 'Employees'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage user accounts, roles and permissions'
              : 'Manage employee information'}
          </p>
        </div>
        {canManageUsers && (
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button
                variant={showInactive ? 'default' : 'outline'}
                onClick={() => {
                  setShowInactive((v) => !v);
                  setPage(1);
                }}
              >
                {showInactive ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            )}
            {pendingCredentials.length > 0 && (
              <Button
                variant="default"
                onClick={() => {
                  exportCredentialsToExcel(pendingCredentials);
                  clearCredentials();
                  toast.success(
                    'Credentials exported — passwords cleared from memory',
                  );
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Credentials
                <Badge variant="secondary" className="ml-2">
                  {pendingCredentials.length}
                </Badge>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await exportPendingPasswordExcel();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pending-password-change.xlsx';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Excel exported');
                } catch (err) {
                  toast.error(getErrorMessage(err));
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Pending
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {isAdmin ? 'Add User' : 'Add Employee'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin
              ? `All Users (${users.length})`
              : `All Employees (${users.length})`}
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
                {canManageUsers && (
                  <TableHead className="w-32">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const initials = u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.role.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.department.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={u.isActive ? 'success' : 'destructive'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {u.mustChangePassword && (
                          <Badge variant="warning">
                            Pending Password
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reset Password"
                              onClick={() => {
                                setSelectedUser(u);
                                setResetDialogOpen(true);
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => {
                              setSelectedUser(u);
                              setDeactivateDialogOpen(true);
                            }}
                          >
                            {u.isActive ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {usersResponse?.meta && (
            <Pagination
              page={page}
              limit={usersResponse.meta.limit}
              total={usersResponse.meta.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAdmin ? 'Add User' : 'Add Employee'}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? 'Create a new user account with role assignment'
                : 'Add a new employee record'}
            </DialogDescription>
          </DialogHeader>
          {isAdmin ? (
            <Formik<AdminCreateValues>
              initialValues={{
                name: '',
                email: '',
                roleId: '',
                deptId: '',
                password: '',
              }}
              validationSchema={adminCreateSchema}
              onSubmit={(values, { setSubmitting, resetForm }) => {
                const submittedPassword = values.password;
                createMutation.mutate(
                  {
                    name: values.name,
                    email: values.email,
                    password: submittedPassword,
                    roleId: Number(values.roleId),
                    deptId: Number(values.deptId),
                  },
                  {
                    onSuccess: () => {
                      addCredential({
                        name: values.name,
                        email: values.email,
                        password: submittedPassword,
                        createdAt: new Date().toLocaleString('th-TH'),
                      });
                      toast.success('User created successfully');
                      resetForm();
                      setDialogOpen(false);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className="space-y-4">
                  <FormikInput
                    name="name"
                    label="Name"
                    placeholder="Full name"
                  />
                  <FormikInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="user@company.com"
                  />
                  <div>
                    <FormikInput
                      name="password"
                      label="Password"
                      type="text"
                      placeholder="15–64 characters"
                    />
                    <div className="mt-1.5 flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { data: pw } = await generatePasswordApi();
                            setFieldValue('password', pw);
                          } catch (err) {
                            toast.error(getErrorMessage(err));
                          }
                        }}
                      >
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                        Auto-generate
                      </Button>
                      {values.password && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(values.password);
                            toast.success('Password copied to clipboard');
                          }}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                  <PasswordStrengthMeter value={values.password} />
                  <FormikSelect
                    name="roleId"
                    label="Role"
                    placeholder="Select role..."
                    options={roleOptions}
                  />
                  <FormikSelect
                    name="deptId"
                    label="Department"
                    placeholder="Select department..."
                    options={deptOptions}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
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
                const submittedPassword = values.password;
                onboardMutation.mutate(
                  {
                    name: values.name,
                    email: values.email,
                    deptId: Number(values.deptId),
                    password: submittedPassword || undefined,
                  },
                  {
                    onSuccess: () => {
                      if (submittedPassword) {
                        addCredential({
                          name: values.name,
                          email: values.email,
                          password: submittedPassword,
                          createdAt: new Date().toLocaleString('th-TH'),
                        });
                      }
                      toast.success('Employee added successfully');
                      resetForm();
                      setDialogOpen(false);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className="space-y-4">
                  <FormikInput
                    name="name"
                    label="Name"
                    placeholder="Full name"
                  />
                  <FormikInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="user@company.com"
                  />
                  <div>
                    <FormikInput
                      name="password"
                      label="Password (optional)"
                      type="text"
                      placeholder="Min 15 characters"
                    />
                    <div className="mt-1.5 flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { data: pw } = await generatePasswordApi();
                            setFieldValue('password', pw);
                          } catch (err) {
                            toast.error(getErrorMessage(err));
                          }
                        }}
                      >
                        <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                        Auto-generate
                      </Button>
                      {values.password && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(values.password);
                            toast.success('Password copied to clipboard');
                          }}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                  <PasswordStrengthMeter value={values.password} />
                  <FormikSelect
                    name="deptId"
                    label="Department"
                    placeholder="Select department..."
                    options={deptOptions}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
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
              {isAdmin
                ? 'Update account details and role'
                : 'Update employee information'}
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
                    onSuccess: () => {
                      toast.success('User updated successfully');
                      setEditDialogOpen(false);
                      setSelectedUser(null);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput
                    name="name"
                    label="Name"
                    placeholder="Full name"
                  />
                  <FormikInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="user@company.com"
                  />
                  <FormikSelect
                    name="roleId"
                    label="Role"
                    placeholder="Select role..."
                    options={roleOptions}
                  />
                  <FormikSelect
                    name="deptId"
                    label="Department"
                    placeholder="Select department..."
                    options={deptOptions}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
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
                    onSuccess: () => {
                      toast.success('User updated successfully');
                      setEditDialogOpen(false);
                      setSelectedUser(null);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput
                    name="name"
                    label="Name"
                    placeholder="Full name"
                  />
                  <FormikSelect
                    name="deptId"
                    label="Department"
                    placeholder="Select department..."
                    options={deptOptions}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
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
              Set a new password for {selectedUser?.name} ({selectedUser?.email}
              )
            </DialogDescription>
          </DialogHeader>
          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={resetPasswordSchema}
            onSubmit={(values, { setSubmitting }) => {
              if (!selectedUser) return;
              updateMutation.mutate(
                {
                  id: selectedUser.id,
                  payload: { password: values.newPassword },
                },
                {
                  onSuccess: () => {
                    toast.success('Password reset successfully');
                    setResetDialogOpen(false);
                    setSelectedUser(null);
                  },
                  onError: (err) => toast.error(getErrorMessage(err)),
                  onSettled: () => setSubmitting(false),
                },
              );
            }}
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-4">
                <FormikInput
                  name="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="15–64 characters"
                />
                <PasswordStrengthMeter value={values.newPassword} />
                <FormikInput
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat password"
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResetDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Activate confirmation dialog */}
      {selectedUser && (
        <Dialog
          open={deactivateDialogOpen}
          onOpenChange={setDeactivateDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser.isActive ? 'Deactivate' : 'Activate'} User
              </DialogTitle>
              <DialogDescription>{deactivateDialogDesc}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeactivateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={selectedUser.isActive ? 'destructive' : 'default'}
                disabled={hrUpdateMutation.isPending}
                onClick={() => {
                  hrUpdateMutation.mutate(
                    {
                      id: selectedUser.id,
                      payload: { isActive: !selectedUser.isActive },
                    },
                    {
                      onSuccess: () => {
                        toast.success(deactivateToastMsg);
                        setDeactivateDialogOpen(false);
                        setSelectedUser(null);
                      },
                      onError: (err) => toast.error(getErrorMessage(err)),
                    },
                  );
                }}
              >
                {deactivateButtonLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
