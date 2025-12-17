import { Suspense } from 'react';
import { useRouteLoaderData, Await } from 'react-router';
import { Box, Skeleton, Alert } from '@mui/material';
import { CommentsAccordion } from './components';
import type { TaskDetailsLoaderData } from '@features/task-details/TaskDetails';
import type { AppLoaderData } from '@features/app-layout/AppLayout';

/**
 * Loading skeleton for task comments
 */
function TaskCommentsLoadingSkeleton() {
  return (
    <Box sx={{ py: 1 }}>
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
 */
export default function TaskComments() {
  const rootData = useRouteLoaderData('root') as AppLoaderData;
  const taskData = useRouteLoaderData('taskDetails') as TaskDetailsLoaderData;
  const currentUserId = rootData.user?.id;

  return (
    <Suspense fallback={<TaskCommentsLoadingSkeleton />}>
      <Await
        resolve={taskData.commentsPromise}
        errorElement={<TaskCommentsErrorFallback />}
      >
        {(comments) => (
          <CommentsAccordion comments={comments} currentUserId={currentUserId} />
        )}
      </Await>
    </Suspense>
  );
}
