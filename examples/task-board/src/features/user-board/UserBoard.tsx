import {
  useLoaderData,
  useNavigate,
  useParams,
  Outlet,
  useRouteLoaderData,
} from 'react-router';
import Box from '@mui/material/Box';
import { isManager } from '@shared/utils';
import { getUserTasks } from './api';
import { TaskList } from './components';
import type { LoaderFunctionArgs } from 'react-router';
import type { User } from '@shared/types';

/**
 * UserBoard loader - fetches tasks for specified user
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { userId } = params;
  if (!userId) {
    throw new Response('User ID is required', { status: 400 });
  }

  return getUserTasks(userId);
}

/**
 * UserBoard Component - Overview of tasks grouped by status for a specific user
 */
export default function UserBoard() {
  const navigate = useNavigate();
  const { teamName, userId } = useParams();
  const currentUser = useRouteLoaderData<User>('root')!;
  const tasks = useLoaderData<Awaited<ReturnType<typeof loader>>>();

  const canDelete = isManager(currentUser);

  const handleTaskClick = (taskId: string) => {
    navigate(`/${teamName}/users/${userId}/${taskId}`);
  };

  const handleOpenCreate = () => {
    navigate(`/${teamName}/users/${userId}/tasks/new`);
  };

  const handleEditClick = (taskId: string) => {
    navigate(`/${teamName}/users/${userId}/tasks/${taskId}`);
  };

  const handleDeleteClick = (taskId: string) => {
    navigate(`/${teamName}/users/${userId}/tasks/${taskId}/delete`);
  };

  return (
    <Box>
      <TaskList
        tasks={tasks}
        onCreateClick={handleOpenCreate}
        onEditClick={handleEditClick}
        onDeleteClick={canDelete ? handleDeleteClick : undefined}
        onTaskClick={handleTaskClick}
      />

      <Outlet />
    </Box>
  );
}
