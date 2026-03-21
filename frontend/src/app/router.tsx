import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/layout/RequireAuth';

import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import DashboardPage from '@/pages/DashboardPage';
import RequestListPage from '@/pages/RequestListPage';
import RequestDetailPage from '@/pages/RequestDetailPage';
import RequestCreatePage from '@/pages/RequestCreatePage';
import EquipmentPage from '@/pages/EquipmentPage';
import UsersPage from '@/pages/UsersPage';
import DepartmentsPage from '@/pages/DepartmentsPage';
import RolesPage from '@/pages/RolesPage';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Protected routes — all authenticated users
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },

          // Repair requests — all roles
          { path: '/requests', element: <RequestListPage /> },
          { path: '/requests/:id', element: <RequestDetailPage /> },
        ],
      },
    ],
  },

  // Protected routes — user, admin can create requests
  {
    element: <RequireAuth allowedRoles={['user', 'admin']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/requests/new', element: <RequestCreatePage /> },
        ],
      },
    ],
  },

  // Protected routes — admin, technician
  {
    element: <RequireAuth allowedRoles={['admin', 'technician']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/equipment', element: <EquipmentPage /> },
        ],
      },
    ],
  },

  // Protected routes — admin, hr
  {
    element: <RequireAuth allowedRoles={['admin', 'hr']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/users', element: <UsersPage /> },
          { path: '/departments', element: <DepartmentsPage /> },
        ],
      },
    ],
  },

  // Protected routes — admin only
  {
    element: <RequireAuth allowedRoles={['admin']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/roles', element: <RolesPage /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
