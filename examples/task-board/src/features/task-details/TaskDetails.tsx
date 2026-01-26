import { useLoaderData, useNavigate, useParams, Outlet, useLocation } from 'react-router';
import { getTaskDetails } from './api';
import { getTaskComments } from '@features/task-comments/api';
import { TaskDetailsDialog } from './components';
import type { LoaderFunctionArgs } from 'react-router';

/**
 * Loader for task details page
 * Task is loaded synchronously (blocking), comments are deferred (streaming)
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = params.taskId || params.id;

  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const task = await getTaskDetails(taskId);
  const commentsPromise = getTaskComments(taskId);

  return { task, commentsPromise };
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
