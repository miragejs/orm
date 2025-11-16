import { Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import Login, { action as loginAction } from './features/auth/Login';
import AppLayout, { loader as appLayoutLoader } from './features/app-layout/AppLayout';
import Dashboard from './features/dashboard/Dashboard';
import ErrorBoundary from './shared/components/ErrorBoundary';

/**
 * Application routes configuration
 * Following React Router 7 Data Mode best practices
 *
 * @see https://reactrouter.com/start/framework/routing
 */
export const routes: RouteObject[] = [
  {
    id: 'root',
    path: '/',
    element: <AppLayout />,
    loader: appLayoutLoader,
    errorElement: <ErrorBoundary />,
    handle: {
      title: 'TaskBoard',
      requiresAuth: true,
    },
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        id: 'dashboard',
        path: 'dashboard',
        element: <Dashboard />,
        handle: {
          title: 'Dashboard',
        },
      },
      // Future routes will be added here:
      // {
      //   id: 'team',
      //   path: 'team',
      //   lazy: () => import('./features/team/Team'),
      // },
    ],
  },
  {
    id: 'auth',
    path: '/auth',
    element: <Login />,
    action: loginAction,
    errorElement: <ErrorBoundary />,
    handle: {
      title: 'Login',
    },
  },
];
