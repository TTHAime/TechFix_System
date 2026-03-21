import { useNavigate } from 'react-router';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/stores/auth';
import { FormikInput } from '@/components/ui/FormikInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Wrench } from 'lucide-react';
import { useState } from 'react';

interface LoginValues {
  email: string;
  password: string;
}

const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [googleLoading, setGoogleLoading] = useState(false);

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

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={googleLoading}
                  onClick={async () => {
                    setGoogleLoading(true);
                    const success = await loginWithGoogle();
                    if (success) {
                      navigate('/dashboard');
                    }
                    setGoogleLoading(false);
                  }}
                >
                  <GoogleIcon />
                  {googleLoading ? 'Signing in...' : 'Sign in with Google'}
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
