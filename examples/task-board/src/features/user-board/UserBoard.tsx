import { useState, useMemo } from 'react';
import { useLoaderData, useNavigate, useParams, Outlet } from 'react-router';
import { Box, Typography, Stack } from '@mui/material';
import { TaskStatus } from '@shared/types';
import { getUserTasks } from './api';
import { TaskStatusSection } from './components';
import { statusConfig, statusOrder } from './config';
import type { LoaderFunctionArgs } from 'react-router';
import type { SimpleTask } from '@shared/types';

/**
 * UserBoard loader - fetches tasks for specified user
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { userId } = params;
  if (!userId) {
    throw new Response('User ID is required', { status: 400 });
  }

  const data = await getUserTasks(userId);
  return data;
}

export interface UserBoardLoaderData {
  tasks: SimpleTask[];
}

/**
 * UserBoard Component - Overview of tasks grouped by status for a specific user
 */
export default function UserBoard() {
  const navigate = useNavigate();
  const { teamName, userId } = useParams();
  const { tasks } = useLoaderData<UserBoardLoaderData>();
  const [expanded, setExpanded] = useState<string>(TaskStatus.IN_PROGRESS);

  const tasksByStatus = useMemo(
    () =>
      tasks.reduce(
        (acc, task) => {
          if (!acc[task.status]) {
            acc[task.status] = [];
          }
          acc[task.status].push(task);
          return acc;
        },
        {} as Record<TaskStatus, SimpleTask[]>,
      ),
    [tasks],
  );

  const handleAccordionChange = (status: TaskStatus, isExpanded: boolean) => {
    setExpanded(isExpanded ? status : '');
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/${teamName}/users/${userId}/${taskId}`);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        My Tasks
      </Typography>

      <Stack spacing={2}>
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const statusTasks = tasksByStatus[status] || [];

          return (
            <TaskStatusSection
              key={status}
              expanded={expanded === status}
              onExpandChange={(isExpanded) => handleAccordionChange(status, isExpanded)}
              onTaskClick={handleTaskClick}
              statusColor={config.color}
              statusIcon={config.icon}
              statusLabel={config.label}
              tasks={statusTasks}
            />
          );
        })}
      </Stack>

      <Outlet />
    </Box>
  );
}
