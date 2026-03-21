import { useNavigate } from 'react-router';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/stores/auth';
import { FormikInput } from '@/components/ui/FormikInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface LoginValues {
  email: string;
  password: string;
}

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const initialValues: LoginValues = { email: '', password: '' };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">TechFix</CardTitle>
          <CardDescription>Sign in to the repair management system</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<LoginValues>
            initialValues={initialValues}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              const success = await login(values.email, values.password);
              if (success) {
                navigate('/dashboard');
              } else {
                setFieldError('email', 'Invalid email or password');
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormikInput name="email" label="Email" type="email" placeholder="admin@company.com" />
                <FormikInput name="password" label="Password" type="password" placeholder="P@ssw0rd" />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 rounded-md border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Demo Accounts</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium">Admin:</span> admin@company.com</p>
              <p><span className="font-medium">HR:</span> hr@company.com</p>
              <p><span className="font-medium">Technician:</span> tech1@company.com</p>
              <p><span className="font-medium">User:</span> somjai@company.com</p>
              <p className="text-muted-foreground/70">Password: any (mock)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
