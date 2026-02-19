import { useLoaderData, useNavigate, Form, redirect } from 'react-router';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { getTaskDetails } from '@features/task-details/api';
import { getUser } from '@features/app-layout/api';
import { isManager } from '@shared/utils';
import { deleteTask } from '@features/task-form/api';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

function getRedirectTo(params: { teamName?: string; userId?: string }): string {
  const { teamName = '', userId } = params;
  if (userId) {
    return `/${teamName}/users/${userId}`;
  }
  return `/${teamName}/dashboard`;
}

/**
 * Loader – ensures current user is manager, loads task for display
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { taskId, teamName, userId } = params;
  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const redirectTo = getRedirectTo({ teamName, userId });

  try {
    const user = await getUser();
    if (!isManager(user)) {
      return redirect(redirectTo);
    }
  } catch {
    return redirect('/auth');
  }

  const task = await getTaskDetails(taskId);
  return { task, redirectTo };
}

export type DeleteTaskLoaderData = Awaited<ReturnType<typeof loader>>;

/**
 * Action – deletes the task and redirects
 */
export async function action({ params }: ActionFunctionArgs) {
  const { taskId, teamName, userId } = params;
  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const redirectTo = getRedirectTo({ teamName, userId });

  try {
    const user = await getUser();
    if (!isManager(user)) {
      return redirect(redirectTo);
    }
  } catch {
    return redirect('/auth');
  }

  await deleteTask(taskId);
  return redirect(redirectTo);
}

/**
 * DeleteTask – route that renders a confirmation dialog.
 * Loader provides task and redirectTo; action performs delete and redirect.
 */
export default function DeleteTask() {
  const navigate = useNavigate();
  const { task, redirectTo } = useLoaderData<DeleteTaskLoaderData>();

  const handleClose = () => {
    navigate(redirectTo);
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      aria-labelledby="delete-task-dialog-title"
      aria-describedby="delete-task-dialog-description"
    >
      <DialogTitle id="delete-task-dialog-title">Delete task?</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-task-dialog-description">
          Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot
          be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Cancel
        </Button>
        <Form method="post">
          <Button type="submit" color="error" variant="contained">
            Delete
          </Button>
        </Form>
      </DialogActions>
    </Dialog>
  );
}
