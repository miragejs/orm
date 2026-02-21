import Login, { action as loginAction } from './features/auth/Login';
import AppLayout, { loader as appLayoutLoader } from './features/app-layout/AppLayout';
import { RoleBasedRedirect } from './features/app-layout/components';
import Dashboard, { loader as dashboardLoader } from './features/dashboard/Dashboard';
import UserBoard, { loader as userBoardLoader } from './features/user-board/UserBoard';
import TaskDetails, {
  loader as taskDetailsLoader,
} from './features/task-details/TaskDetails';
import TaskComments, {
  action as taskCommentsAction,
  loader as taskCommentsLoader,
} from './features/task-comments/TaskComments';
import Team, { loader as teamLoader } from './features/team/Team';
import {
  TaskForm,
  TaskRoutesLayout,
  action as taskFormAction,
  loader as taskFormLoader,
} from './features/task-form';
import { DeleteTask, deleteTaskLoader, deleteTaskAction } from './features/delete-task';
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
                path: 'tasks/:taskId',
                element: <TaskRoutesLayout />,
                children: [
                  {
                    id: 'dashboardTaskForm',
                    index: true,
                    element: <TaskForm />,
                    loader: taskFormLoader,
                    action: taskFormAction,
                    handle: { title: 'Task Form' },
                  },
                  {
                    id: 'dashboardDeleteTask',
                    path: 'delete',
                    element: <DeleteTask />,
                    loader: deleteTaskLoader,
                    action: deleteTaskAction,
                    handle: { title: 'Delete Task' },
                  },
                ],
              },
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
                    loader: taskCommentsLoader,
                    action: taskCommentsAction,
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
                path: 'tasks/:taskId',
                element: <TaskRoutesLayout />,
                children: [
                  {
                    id: 'userTaskForm',
                    index: true,
                    element: <TaskForm />,
                    loader: taskFormLoader,
                    action: taskFormAction,
                    handle: { title: 'Task Form' },
                  },
                  {
                    id: 'userDeleteTask',
                    path: 'delete',
                    element: <DeleteTask />,
                    loader: deleteTaskLoader,
                    action: deleteTaskAction,
                    handle: { title: 'Delete Task' },
                  },
                ],
              },
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
                    loader: taskCommentsLoader,
                    action: taskCommentsAction,
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
