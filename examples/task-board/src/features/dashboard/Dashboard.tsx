import { useState, useMemo } from 'react';
import { useLoaderData, useNavigate, Outlet } from 'react-router';
import { Box, Typography, Stack } from '@mui/material';
import { TaskStatus, type Task } from '@shared/types';
import { getTasks } from './api';
import { TaskStatusSection } from './components';
import { statusConfig, statusOrder } from './config/statusConfig';
/**
 * Dashboard loader - fetches user tasks
 */
export async function loader() {
  const data = await getTasks();
  return data;
}

/**
 * Dashboard Component - Overview of tasks grouped by status
 */
export default function Dashboard() {
  const { tasks } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState<string>(TaskStatus.IN_PROGRESS);

  // Group tasks by status - memoized to avoid recalculation
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
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks],
  );

  const handleAccordionChange = (status: TaskStatus, isExpanded: boolean) => {
    setExpanded(isExpanded ? status : '');
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/dashboard/${taskId}`);
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
              statusLabel={config.label}
              statusIcon={config.icon}
              statusColor={config.color}
              tasks={statusTasks}
              expanded={expanded === status}
              onExpandChange={(isExpanded) => handleAccordionChange(status, isExpanded)}
              onTaskClick={handleTaskClick}
            />
          );
        })}
      </Stack>

      {/* Outlet for nested routes (TaskDetails dialog) */}
      <Outlet />
    </Box>
  );
}
