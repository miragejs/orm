import { Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import Login, { action as loginAction } from './features/auth/Login';
import AppLayout, { loader as appLayoutLoader } from './features/app-layout/AppLayout';
import Dashboard, { loader as dashboardLoader } from './features/dashboard/Dashboard';
import TaskDetails, {
  loader as taskDetailsLoader,
} from './features/task-details/TaskDetails';
import TaskComments from './features/task-comments/TaskComments';
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
        loader: dashboardLoader,
        handle: {
          title: 'Dashboard',
        },
        children: [
          {
            id: 'taskDetails',
            path: ':id',
            element: <TaskDetails />,
            loader: taskDetailsLoader,
            handle: {
              title: 'Task Details',
            },
            children: [
              {
                index: true,
                element: <TaskComments />,
              },
            ],
          },
        ],
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
