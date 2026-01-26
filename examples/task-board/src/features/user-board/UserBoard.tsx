import { useLoaderData, useNavigate, useParams, Outlet } from 'react-router';
import Box from '@mui/material/Box';
import { getUserTasks } from './api';
import { TaskList } from './components';
import type { LoaderFunctionArgs } from 'react-router';

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
  const tasks = useLoaderData<Awaited<ReturnType<typeof loader>>>();

  const handleTaskClick = (taskId: string) => {
    navigate(`/${teamName}/users/${userId}/${taskId}`);
  };

  return (
    <Box>
      <TaskList tasks={tasks} onTaskClick={handleTaskClick} />
      <Outlet />
    </Box>
  );
}
