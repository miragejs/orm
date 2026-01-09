import { useLoaderData, useNavigate, useParams, Outlet } from 'react-router';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
} from '@mui/material';
import { getTaskDetails } from './api';
import { getTaskComments } from '@features/task-comments/api';
import { formatTaskTitle } from '@shared/utils';
import {
  TaskStatusChips,
  TaskPeopleSection,
  TaskTeamCard,
  TaskDatesInfo,
} from './components';
import type { Task, Comment } from '@shared/types';
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

export interface TaskDetailsLoaderData {
  task: Task;
  commentsPromise: Promise<Comment[]>;
}

/**
 * Task Details Dialog Component
 * Acts as a layout route - renders task info and Outlet for child routes (comments)
 */
export default function TaskDetails() {
  const { task } = useLoaderData<TaskDetailsLoaderData>();
  const navigate = useNavigate();
  const { teamName, userId } = useParams();

  const handleClose = () => {
    // Navigate back to the parent route (Dashboard or UserBoard)
    if (userId) {
      navigate(`/${teamName}/users/${userId}`);
    } else {
      navigate(`/${teamName}/dashboard`);
    }
  };

  return (
    <Dialog open={true} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{formatTaskTitle(task)}</DialogTitle>

      <DialogContent>
        <TaskStatusChips status={task.status} priority={task.priority} />

        <Typography variant="body2">{task.description}</Typography>

        <Divider sx={{ my: 2 }} />

        <TaskPeopleSection assignee={task.assignee} creator={task.creator} />

        {task.team && <TaskTeamCard team={task.team} />}

        <TaskDatesInfo dueDate={task.dueDate} createdAt={task.createdAt} />

        <Divider sx={{ my: 2 }} />

        {/* Comments Section - Rendered via child route */}
        <Outlet />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
