import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AppErrorBoundary } from '@/app/ErrorBoundary';
import { router } from '@/app/router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    useAuthStore.getState().fetchMe();
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
