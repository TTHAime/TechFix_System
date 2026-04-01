import { useState } from 'react';
import { useDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from '@/features/departments/hooks';
import type { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormikInput } from '@/components/ui/FormikInput';
import { Plus, Pencil, MapPin, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';

interface DepartmentFormValues {
  name: string;
  location: string;
}

const departmentSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  location: Yup.string().required('Location is required'),
});

export default function DepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const { hasRole } = useAuthStore();

  const { data: response, isLoading, isError } = useDepartmentsQuery();
  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const deleteMutation = useDeleteDepartmentMutation();

  const canManage = hasRole('admin');

  const initialValues: DepartmentFormValues = { name: '', location: '' };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading departments...</div>;
  }

  if (isError) {
    return <div className="flex items-center justify-center p-8 text-destructive">Failed to load departments</div>;
  }

  const departments = response?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage organization departments</p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments ({departments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                {canManage && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.id}</TableCell>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {dept.location}
                    </div>
                  </TableCell>
                  {canManage && (
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedDept(dept); setEditDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedDept(dept); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add department dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>Create a new department</DialogDescription>
          </DialogHeader>
          <Formik<DepartmentFormValues>
            initialValues={initialValues}
            validationSchema={departmentSchema}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              createMutation.mutate(values, {
                onSuccess: () => {
                  toast.success('Department created successfully');
                  resetForm();
                  setDialogOpen(false);
                },
                onError: (err) => toast.error(getErrorMessage(err)),
                onSettled: () => setSubmitting(false),
              });
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInput name="name" label="Department Name" placeholder="e.g. IT" />
                <FormikInput name="location" label="Location" placeholder="e.g. Building A, Floor 3" />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Department'}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete department confirmation dialog */}
      {selectedDept && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Department</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedDept.name}&quot;?
                This action cannot be undone. The department must have no users or equipment assigned.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(selectedDept.id, {
                    onSuccess: () => {
                      toast.success('Department deleted successfully');
                      setDeleteDialogOpen(false);
                      setSelectedDept(null);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                  });
                }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit department dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          {selectedDept && (
            <Formik<DepartmentFormValues>
              initialValues={{ name: selectedDept.name, location: selectedDept.location }}
              validationSchema={departmentSchema}
              onSubmit={(values, { setSubmitting }) => {
                updateMutation.mutate(
                  { id: selectedDept.id, payload: values },
                  {
                    onSuccess: () => {
                      toast.success('Department updated successfully');
                      setEditDialogOpen(false);
                      setSelectedDept(null);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput name="name" label="Department Name" placeholder="e.g. IT" />
                  <FormikInput name="location" label="Location" placeholder="e.g. Building A, Floor 3" />
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
    </div>
  );
}
