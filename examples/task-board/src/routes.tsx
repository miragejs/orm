import Login, { action as loginAction } from './features/auth/Login';
import AppLayout, { loader as appLayoutLoader } from './features/app-layout/AppLayout';
import { RoleBasedRedirect } from './features/app-layout/components';
import Dashboard, { loader as dashboardLoader } from './features/dashboard/Dashboard';
import UserBoard, { loader as userBoardLoader } from './features/user-board/UserBoard';
import TaskDetails, {
  loader as taskDetailsLoader,
} from './features/task-details/TaskDetails';
import TaskComments from './features/task-comments/TaskComments';
import Team, { loader as teamLoader } from './features/team/Team';
import ErrorBoundary from './shared/components/ErrorBoundary';
import type { RouteObject } from 'react-router';

/**
 * Application routes configuration
 * Following React Router 7 Data Mode best practices
 *
 * Route Structure:
 * - /:teamName/dashboard            - Manager's dashboard
 * - /:teamName/dashboard/:taskId    - Task details (manager view)
 * - /:teamName/users/:userId        - User's task board
 * - /:teamName/users/:userId/:taskId - Task details (user view)
 * - /:teamName/users/:userId/team   - Team page
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
      // Index route - redirects based on user role
      {
        index: true,
        element: <RoleBasedRedirect />,
      },
      // Team-scoped routes
      {
        path: ':teamName',
        children: [
          // Manager routes
          {
            id: 'dashboard',
            path: 'dashboard',
            element: <Dashboard />,
            loader: dashboardLoader,
            handle: {
              title: 'Dashboard',
              requiresRole: 'MANAGER',
            },
            children: [
              {
                id: 'dashboardTaskDetails',
                path: ':taskId',
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
          // User routes
          {
            id: 'userBoard',
            path: 'users/:userId',
            element: <UserBoard />,
            loader: userBoardLoader,
            handle: {
              title: 'My Tasks',
              requiresRole: 'USER',
            },
            children: [
              {
                id: 'userTaskDetails',
                path: ':taskId',
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
          {
            id: 'team',
            path: 'users/:userId/team',
            element: <Team />,
            loader: teamLoader,
            handle: {
              title: 'Team',
              requiresRole: 'USER',
            },
          },
        ],
      },
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
