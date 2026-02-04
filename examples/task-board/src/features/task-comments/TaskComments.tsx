import { Suspense } from 'react';
import { useRouteLoaderData, useLoaderData, Await } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { addTaskComment, getTaskComments } from './api';
import { CommentsAccordion } from './components';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import type { User } from '@shared/types';

/**
 * Loader for task comments - deferred loading
 */
export function loader({ params }: LoaderFunctionArgs) {
  const taskId = params.taskId || params.id;

  if (!taskId) {
    throw new Response('Task ID is required', { status: 400 });
  }

  const commentsPromise = getTaskComments(taskId);

  return { taskId, commentsPromise };
}

export type TaskCommentsLoaderData = ReturnType<typeof loader>;

/**
 * Action handler for adding a new comment
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const taskId = formData.get('taskId') as string;
  const content = formData.get('content') as string;

  if (!taskId) {
    return { error: 'Task ID is required' };
  }

  if (!content?.trim()) {
    return { error: 'Comment content is required' };
  }

  try {
    await addTaskComment(taskId, content.trim());
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add comment' };
  }
}

/**
 * Loading skeleton for task comments
 */
function TaskCommentsLoadingSkeleton() {
  return (
    <Box sx={{ py: 1 }} aria-label="Comments loading">
      {[1, 2].map((i) => (
        <Box key={i} sx={{ display: 'flex', mb: 2, gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rounded" width="60%" height={60} />
            <Skeleton variant="text" width={100} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Error fallback for task comments loading
 */
function TaskCommentsErrorFallback() {
  return (
    <Alert severity="error" sx={{ mt: 1 }}>
      Failed to load comments
    </Alert>
  );
}

/**
 * Task Comments Component - Displays comments for a task with deferred loading
 * Works for both dashboard and user task details routes
 */
export default function TaskComments() {
  const currentUser = useRouteLoaderData<User>('root')!;
  const { taskId, commentsPromise } = useLoaderData<TaskCommentsLoaderData>();

  return (
    <Suspense fallback={<TaskCommentsLoadingSkeleton />}>
      <Await resolve={commentsPromise} errorElement={<TaskCommentsErrorFallback />}>
        {(comments) => (
          <CommentsAccordion
            comments={comments}
            currentUserId={currentUser.id}
            taskId={taskId}
          />
        )}
      </Await>
    </Suspense>
  );
}
