import { useLoaderData, useNavigate, useParams, Outlet, useLocation } from 'react-router';
import { getTaskDetails } from './api';
import { TaskDetailsDialog } from './components';
import type { LoaderFunctionArgs } from 'react-router';

/**
 * Loader for task details page
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = params.taskId || params.id;

  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const task = await getTaskDetails(taskId);

  return { task };
}

export type TaskDetailsLoaderData = Awaited<ReturnType<typeof loader>>;

export default function TaskDetails() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { teamName, userId } = useParams();
  const { task } = useLoaderData<TaskDetailsLoaderData>();

  const handleClose = () => {
    // Navigate back to the parent route (Dashboard or UserBoard)
    if (userId) {
      navigate({ pathname: `/${teamName}/users/${userId}`, search });
    } else {
      navigate({ pathname: `/${teamName}/dashboard`, search });
    }
  };

  return (
    <TaskDetailsDialog task={task} onClose={handleClose}>
      {/* Comments Section - Rendered via child route */}
      <Outlet />
    </TaskDetailsDialog>
  );
}
