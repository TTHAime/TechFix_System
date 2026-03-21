import { useState } from 'react';
import { mockEquipment, mockCategories, mockDepartments } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormikInput } from '@/components/ui/FormikInput';
import { FormikSelect } from '@/components/ui/FormikSelect';
import { Plus, Pencil } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

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
  const { hasRole } = useAuthStore();

  const categoryOptions = mockCategories.map((c) => ({ value: String(c.id), label: c.name }));
  const deptOptions = mockDepartments.map((d) => ({ value: String(d.id), label: d.name }));

  const initialValues: EquipmentFormValues = { name: '', serialNo: '', categoryId: '', deptId: '' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
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
          <CardTitle>All Equipment ({mockEquipment.length})</CardTitle>
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
                {hasRole('admin') && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEquipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell className="font-mono text-xs">{eq.serialNo}</TableCell>
                  <TableCell>{eq.category.name}</TableCell>
                  <TableCell>{eq.department.name}</TableCell>
                  <TableCell>
                    <Badge variant={eq.isActive ? 'success' : 'secondary'}>
                      {eq.isActive ? 'Active' : 'Inactive'}
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
            <DialogDescription>Register new equipment in the system</DialogDescription>
          </DialogHeader>
          <Formik<EquipmentFormValues>
            initialValues={initialValues}
            validationSchema={equipmentSchema}
            onSubmit={(_values, { setSubmitting }) => {
              setTimeout(() => {
                setSubmitting(false);
                setDialogOpen(false);
              }, 500);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInput name="name" label="Name" placeholder="e.g. Dell OptiPlex 7090" />
                <FormikInput name="serialNo" label="Serial Number" placeholder="e.g. DL-OPT-7090-001" />
                <FormikSelect name="categoryId" label="Category" placeholder="Select category..." options={categoryOptions} />
                <FormikSelect name="deptId" label="Department" placeholder="Select department..." options={deptOptions} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Equipment'}
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
