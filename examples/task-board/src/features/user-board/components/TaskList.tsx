import { useState, useMemo, useId } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { TaskStatus } from '@shared/enums';
import { statusConfig, statusOrder } from '../config';
import TaskStatusSection from './TaskStatusSection';
import type { TaskListItem } from '@shared/types';

interface TaskListProps {
  tasks: TaskListItem[];
  onTaskClick: (taskId: string) => void;
}

/**
 * TaskList Component - Displays tasks grouped by status in accordion sections
 */
export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  const [expanded, setExpanded] = useState<string>(TaskStatus.IN_PROGRESS);
  const titleId = useId();

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
        {} as Record<TaskStatus, TaskListItem[]>,
      ),
    [tasks],
  );

  const handleAccordionChange = (status: TaskStatus, isExpanded: boolean) => {
    setExpanded(isExpanded ? status : '');
  };

  return (
    <Box component="section">
      <Typography id={titleId} variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        My Tasks
      </Typography>

      <Stack spacing={2} role="group" aria-labelledby={titleId}>
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const statusTasks = tasksByStatus[status] || [];

          return (
            <TaskStatusSection
              key={status}
              expanded={expanded === status}
              onExpandChange={(isExpanded) => handleAccordionChange(status, isExpanded)}
              onTaskClick={onTaskClick}
              status={status}
              statusColor={config.color}
              statusIcon={config.icon}
              statusLabel={config.label}
              tasks={statusTasks}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
