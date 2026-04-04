import { useState } from 'react';
import {
  useEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
} from '@/features/equipment/hooks';
import { useEquipmentCategoriesQuery } from '@/features/equipment-categories/hooks';
import { useDepartmentsQuery } from '@/features/departments/hooks';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';

interface EquipmentFormValues {
  name: string;
  serialNo: string;
  categoryId: string;
  deptId: string;
}

const equipmentSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  serialNo: Yup.string().required('Serial number is required'),
  categoryId: Yup.string().required('Category is required'),
  deptId: Yup.string().required('Department is required'),
});

export default function EquipmentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    (typeof equipment)[0] | null
  >(null);
  const updateMutation = useUpdateEquipmentMutation();
  const deleteMutation = useDeleteEquipmentMutation();
  const { hasRole } = useAuthStore();

  const isAdmin = hasRole('admin');
  const { data: eqResponse, isLoading, isError } = useEquipmentQuery();
  const { data: catResponse } = useEquipmentCategoriesQuery(1, 100, isAdmin);
  const { data: deptResponse } = useDepartmentsQuery(1, 20, isAdmin);
  const createMutation = useCreateEquipmentMutation();

  const equipment = eqResponse?.data ?? [];
  const categoryOptions = (catResponse?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  const deptOptions = (deptResponse?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  const initialValues: EquipmentFormValues = {
    name: '',
    serialNo: '',
    categoryId: '',
    deptId: '',
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-8">
        Loading equipment...
      </div>
    );
  if (isError)
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Failed to load equipment
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Equipment</h1>
          <p className="text-muted-foreground">Manage registered equipment</p>
        </div>
        {hasRole('admin') && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment ({equipment.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Serial No.</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {hasRole('admin') && (
                  <TableHead className="w-20">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {eq.serialNo}
                  </TableCell>
                  <TableCell>{eq.category.name}</TableCell>
                  <TableCell>{eq.department.name}</TableCell>
                  <TableCell>
                    <Badge variant={eq.isActive ? 'success' : 'secondary'}>
                      {eq.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {hasRole('admin') && (
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEquipment(eq);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEquipment(eq);
                          setDeleteDialogOpen(true);
                        }}
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

      {/* Add equipment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>
              Register new equipment in the system
            </DialogDescription>
          </DialogHeader>
          <Formik<EquipmentFormValues>
            initialValues={initialValues}
            validationSchema={equipmentSchema}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              createMutation.mutate(
                {
                  name: values.name,
                  serialNo: values.serialNo,
                  categoryId: Number(values.categoryId),
                  deptId: Number(values.deptId),
                },
                {
                  onSuccess: () => {
                    toast.success('Equipment created successfully');
                    resetForm();
                    setDialogOpen(false);
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
                  placeholder="e.g. Dell OptiPlex 7090"
                />
                <FormikInput
                  name="serialNo"
                  label="Serial Number"
                  placeholder="e.g. DL-OPT-7090-001"
                />
                <FormikSelect
                  name="categoryId"
                  label="Category"
                  placeholder="Select category..."
                  options={categoryOptions}
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
                    {isSubmitting ? 'Adding...' : 'Add Equipment'}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      {selectedEquipment && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Equipment</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate &quot;{selectedEquipment.name}&quot;?
                This equipment will no longer appear in the list but can be restored later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(selectedEquipment.id, {
                    onSuccess: () => {
                      toast.success('Equipment deactivated successfully');
                      setDeleteDialogOpen(false);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                  });
                }}
              >
                {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedEquipment && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Equipment</DialogTitle>
              <DialogDescription>Update equipment information</DialogDescription>
            </DialogHeader>
            <Formik<EquipmentFormValues>
              initialValues={{
                name: selectedEquipment.name,
                serialNo: selectedEquipment.serialNo,
                categoryId: String(selectedEquipment.category.id),
                deptId: String(selectedEquipment.department.id),
              }}
              validationSchema={equipmentSchema}
              onSubmit={(values, { setSubmitting }) => {
                updateMutation.mutate(
                  {
                    id: selectedEquipment.id,
                    payload: {
                      name: values.name,
                      serialNo: values.serialNo,
                      categoryId: Number(values.categoryId),
                      deptId: Number(values.deptId),
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success('Equipment updated successfully');
                      setEditDialogOpen(false);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                    onSettled: () => setSubmitting(false),
                  },
                );
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <FormikInput name="name" label="Name" />
                  <FormikInput name="serialNo" label="Serial Number" />
                  <FormikSelect
                    name="categoryId"
                    label="Category"
                    placeholder="Select category..."
                    options={categoryOptions}
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
