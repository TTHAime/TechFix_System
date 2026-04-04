import { useState } from 'react';
import {
  useEquipmentCategoriesQuery,
  useCreateEquipmentCategoryMutation,
  useUpdateEquipmentCategoryMutation,
  useDeleteEquipmentCategoryMutation,
} from '@/features/equipment-categories/hooks';
import type { EquipmentCategory } from '@/types';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';

interface CategoryFormValues {
  name: string;
}

const categorySchema = Yup.object({
  name: Yup.string().required('Name is required'),
});

export default function EquipmentCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<EquipmentCategory | null>(null);

  const { data: response, isLoading, isError } = useEquipmentCategoriesQuery();
  const createMutation = useCreateEquipmentCategoryMutation();
  const updateMutation = useUpdateEquipmentCategoryMutation();
  const deleteMutation = useDeleteEquipmentCategoryMutation();

  const initialValues: CategoryFormValues = { name: '' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading categories...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Failed to load categories
      </div>
    );
  }

  const categories = response?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Equipment Categories
          </h1>
          <p className="text-muted-foreground">
            Manage equipment category types
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.id}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add category dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new equipment category
            </DialogDescription>
          </DialogHeader>
          <Formik<CategoryFormValues>
            initialValues={initialValues}
            validationSchema={categorySchema}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              createMutation.mutate(values, {
                onSuccess: () => {
                  toast.success('Category created successfully');
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
                <FormikInput
                  name="name"
                  label="Category Name"
                  placeholder="e.g. Computer, Printer, Network"
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
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete category confirmation dialog */}
      {selectedCategory && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedCategory.name}
                &quot;? This action cannot be undone. The category must have no
                equipment assigned.
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
                  deleteMutation.mutate(selectedCategory.id, {
                    onSuccess: () => {
                      toast.success('Category deleted successfully');
                      setDeleteDialogOpen(false);
                      setSelectedCategory(null);
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

      {/* Edit category dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <Formik<CategoryFormValues>
              initialValues={{ name: selectedCategory.name }}
              validationSchema={categorySchema}
              onSubmit={(values, { setSubmitting }) => {
                updateMutation.mutate(
                  { id: selectedCategory.id, payload: values },
                  {
                    onSuccess: () => {
                      toast.success('Category updated successfully');
                      setEditDialogOpen(false);
                      setSelectedCategory(null);
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
                    label="Category Name"
                    placeholder="e.g. Computer, Printer, Network"
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
    </div>
  );
}
