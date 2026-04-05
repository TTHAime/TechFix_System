import { useNavigate } from 'react-router';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/stores/auth';
import { forceChangePasswordApi } from '@/features/auth/api';
import { FormikInput } from '@/components/ui/FormikInput';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';

interface ChangePasswordValues {
  newPassword: string;
  confirmPassword: string;
}

const changePasswordSchema = Yup.object({
  newPassword: Yup.string()
    .min(15, 'Password must be at least 15 characters')
    .max(64, 'Password must not exceed 64 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm the password'),
});

export default function ForceChangePasswordPage() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const initialValues: ChangePasswordValues = {
    newPassword: '',
    confirmPassword: '',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Change Your Password</CardTitle>
          <CardDescription>
            For security, you must set a new password before continuing. The
            temporary password provided by your administrator cannot be reused.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<ChangePasswordValues>
            initialValues={initialValues}
            validationSchema={changePasswordSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await forceChangePasswordApi(values.newPassword);
                toast.success('Password changed successfully');
                await fetchMe();
                navigate('/dashboard');
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
              setSubmitting(false);
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
