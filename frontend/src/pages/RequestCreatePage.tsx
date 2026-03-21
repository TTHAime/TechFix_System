import { useNavigate } from 'react-router';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { FormikTextarea } from '@/components/ui/FormikTextarea';
import { FormikSelect } from '@/components/ui/FormikSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockEquipment } from '@/lib/mock-data';
import { ArrowLeft } from 'lucide-react';

interface RequestCreateValues {
  description: string;
  equipmentId: string;
  issueDetail: string;
}

const requestCreateSchema = Yup.object({
  description: Yup.string().required('Description is required'),
  equipmentId: Yup.string().required('Equipment is required'),
  issueDetail: Yup.string().required('Issue detail is required'),
});

export default function RequestCreatePage() {
  const navigate = useNavigate();

  const equipmentOptions = mockEquipment.map((e) => ({
    value: String(e.id),
    label: `${e.name} (${e.serialNo})`,
  }));

  const initialValues: RequestCreateValues = {
    description: '',
    equipmentId: '',
    issueDetail: '',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Repair Request</h1>
          <p className="text-sm text-muted-foreground">Submit a new repair request for equipment</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Describe the issue and select the equipment</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<RequestCreateValues>
            initialValues={initialValues}
            validationSchema={requestCreateSchema}
            onSubmit={(_values, { setSubmitting }) => {
              // TODO: call API
              setTimeout(() => {
                setSubmitting(false);
                navigate('/requests');
              }, 500);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikTextarea
                  name="description"
                  label="Description"
                  placeholder="Describe the overall issue..."
                  rows={3}
                />
                <FormikSelect
                  name="equipmentId"
                  label="Equipment"
                  placeholder="Select equipment..."
                  options={equipmentOptions}
                />
                <FormikTextarea
                  name="issueDetail"
                  label="Issue Detail"
                  placeholder="Detailed description of the issue with this equipment..."
                  rows={3}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/requests')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
