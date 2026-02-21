import { useState, useMemo, useId } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { TaskStatus } from '@shared/enums';
import TaskStatusSection from './TaskStatusSection';
import { statusConfig, statusOrder } from './taskStatusSectionConfig';
import type { TaskItem } from '@shared/types';

interface TaskListProps {
  tasks: TaskItem[];
  onCreateClick?: () => void;
  onEditClick?: (taskId: string) => void;
  onDeleteClick?: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
}

/**
 * TaskList Component - Displays tasks grouped by status in accordion sections
 */
export default function TaskList({
  tasks,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onTaskClick,
}: TaskListProps) {
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
        {} as Record<TaskStatus, TaskItem[]>,
      ),
    [tasks],
  );

  const handleAccordionChange = (status: TaskStatus, isExpanded: boolean) => {
    setExpanded(isExpanded ? status : '');
  };

  return (
    <Box component="section">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 3,
        }}
      >
        <Typography id={titleId} variant="h5" component="h2" gutterBottom sx={{ mb: 0 }}>
          My Tasks
        </Typography>
        {onCreateClick && (
          <Button
            aria-label="Create task"
            onClick={onCreateClick}
            startIcon={<AddIcon />}
            variant="contained"
            sx={{ borderRadius: 9999 }}
          >
            Create
          </Button>
        )}
      </Box>

      <Stack spacing={2} role="group" aria-labelledby={titleId}>
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const statusTasks = tasksByStatus[status] || [];

          return (
            <TaskStatusSection
              key={status}
              expanded={expanded === status}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
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
